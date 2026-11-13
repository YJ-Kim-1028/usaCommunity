/**
 * 기존 목록 뒤에 새로 불러온 글을 붙인다. 같은 글(id)이 이미 있으면 다시 넣지 않는다.
 * "더 보기"로 다음 페이지를 불러오는 사이에 새 글이 올라오면 같은 글이 두 번 보일 수 있어서 필요하다.
 */
export function appendUnique<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}
