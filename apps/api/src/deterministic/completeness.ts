export interface CompletenessResult {
  score: number;
  breakdown: {
    personal: number;
    education: number;
    employment: number;
    languages: number;
    documents: number;
    media: number;
  };
  gaps: Array<{
    category: string;
    field: string;
    description: string;
    weight: number;
    suggestedAction: string;
  }>;
}

export function computeCompleteness(profile: {
  goal?: string;
  personal?: any;
  educations?: any[];
  employments?: any[];
  languages?: any[];
  documents?: any[];
  media?: any[];
}): CompletenessResult {
  const gaps: CompletenessResult['gaps'] = [];
  const breakdown = {
    personal: 0,
    education: 0,
    employment: 0,
    languages: 0,
    documents: 0,
    media: 0,
  };

  // 1. Personal (20 pts)
  if (profile.personal?.name) breakdown.personal += 6;
  else gaps.push({ category: 'Personal', field: 'name', description: 'Full legal name as on passport', weight: 6, suggestedAction: 'Provide full name' });

  if (profile.personal?.dob) breakdown.personal += 5;
  else gaps.push({ category: 'Personal', field: 'dob', description: 'Date of birth', weight: 5, suggestedAction: 'Provide date of birth' });

  if (profile.personal?.cityIndia) breakdown.personal += 4;
  else gaps.push({ category: 'Personal', field: 'cityIndia', description: 'Current city in India', weight: 4, suggestedAction: 'Provide current city' });

  if (profile.personal?.targetCityGermany || profile.personal?.availabilityDate) breakdown.personal += 5;
  else gaps.push({ category: 'Personal', field: 'targetCityGermany', description: 'Target German city or intended intake', weight: 5, suggestedAction: 'Specify target intake/city' });

  // 2. Education (25 pts)
  if (profile.educations && profile.educations.length > 0) {
    const primary = profile.educations[0];
    if (primary.degree) breakdown.education += 10;
    if (primary.institution) breakdown.education += 8;
    if (primary.grade) breakdown.education += 7;
  } else {
    gaps.push({ category: 'Education', field: 'degree', description: 'Highest qualification degree and university', weight: 25, suggestedAction: 'Add highest educational qualification' });
  }

  // 3. Languages (25 pts)
  if (profile.languages && profile.languages.length > 0) {
    const hasGerman = profile.languages.some((l) => l.language?.toLowerCase().includes('german'));
    const hasEnglish = profile.languages.some((l) => l.language?.toLowerCase().includes('english'));

    if (hasGerman) breakdown.languages += 15;
    else gaps.push({ category: 'Languages', field: 'german', description: 'German language proficiency level (CEFR)', weight: 15, suggestedAction: 'Declare or test German level' });

    if (hasEnglish) breakdown.languages += 10;
    else gaps.push({ category: 'Languages', field: 'english', description: 'English proficiency test or level', weight: 10, suggestedAction: 'Provide English level' });
  } else {
    gaps.push({ category: 'Languages', field: 'languages', description: 'Language proficiencies (German / English)', weight: 25, suggestedAction: 'Add German and English proficiency' });
  }

  // 4. Employment / Experience (10 pts)
  if (profile.employments && profile.employments.length > 0) {
    breakdown.employment = 10;
  } else if (profile.goal === 'WORK') {
    gaps.push({ category: 'Employment', field: 'employments', description: 'Professional work experience required for work visas', weight: 10, suggestedAction: 'Add work experience' });
  } else if (profile.goal === 'STUDY' || profile.goal === 'VOCATIONAL') {
    // Fresh students / trainees do not require prior employment
    breakdown.employment = 5;
  } else {
    gaps.push({ category: 'Employment', field: 'employments', description: 'Employment history or student status', weight: 10, suggestedAction: 'Add work or internship history' });
  }

  // 5. Documents (15 pts)
  if (profile.documents && profile.documents.length > 0) {
    const count = profile.documents.length;
    breakdown.documents = Math.min(15, count * 5);
  } else {
    gaps.push({ category: 'Documents', field: 'documents', description: 'Verification documents (Degree/Transcript/Passport)', weight: 15, suggestedAction: 'Upload official certificates' });
  }

  // 6. Media / Video (5 pts)
  if (profile.media && profile.media.length > 0) {
    breakdown.media = 5;
  } else {
    gaps.push({ category: 'Media', field: 'introVideo', description: '60-second video self-introduction', weight: 5, suggestedAction: 'Record short video introduction' });
  }

  const score = Math.min(
    100,
    breakdown.personal +
      breakdown.education +
      breakdown.languages +
      breakdown.employment +
      breakdown.documents +
      breakdown.media,
  );

  return {
    score,
    breakdown,
    gaps: gaps.sort((a, b) => b.weight - a.weight),
  };
}
