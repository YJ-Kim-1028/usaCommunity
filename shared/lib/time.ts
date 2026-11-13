export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

/** 닉네임으로 아바타 색을 고정해서 고른다(같은 사람은 항상 같은 색) */
export function tintIndexOf(name: string): number {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return sum;
}
