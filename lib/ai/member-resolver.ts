import type { OrgMemberView } from '@/lib/domain/organization/listMembers';

export type MemberMatch = {
  userId: string;
  fullName: string | null;
  role: string;
  score: number;
};

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

export function searchMembersByQuery(
  members: OrgMemberView[],
  query: string,
  limit = 5,
): MemberMatch[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return [];
  }

  return members
    .map((member) => {
      const haystack = (member.fullName ?? member.userId).toLowerCase();
      let score = 0;
      for (const token of queryTokens) {
        if (haystack.includes(token)) {
          score += token.length >= 3 ? 2 : 1;
        }
      }
      return {
        userId: member.userId,
        fullName: member.fullName,
        role: member.role,
        score,
      };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function formatMemberDisambiguation(matches: MemberMatch[]): string {
  const options = matches
    .slice(0, 3)
    .map((match, index) => `${index + 1}. ${match.fullName ?? 'Team member'} (${match.role})`)
    .join('\n');

  return `I found multiple team members. Which one?\n${options}`;
}
