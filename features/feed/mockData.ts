// TODO: Supabase 연동 후 실제 API 호출(features/feed/api.ts)로 교체할 임시 목업 데이터

export type Post = {
  id: string;
  author: string;
  avatarInitial: string;
  avatarTintIndex: number;
  mbti: string;
  iljuLabel: string;
  timeAgo: string;
  title: string;
  preview: string;
  likeCount: number;
  commentCount: number;
  body?: string;
};

export const posts: Post[] = [
  {
    id: '1',
    author: '달빛여행자',
    avatarInitial: '달',
    avatarTintIndex: 0,
    mbti: 'INFP',
    iljuLabel: '병오일주',
    timeAgo: '12분 전',
    title: '저만 이런 성격이신 분?',
    preview: '요즘 부쩍 혼자 있는 시간이 편해지는데 다들 그런가요...',
    body: '요즘 부쩍 혼자 있는 시간이 편해지는데 다들 그런가요.\n친구들 만나는 것도 좋긴 한데 집에 오면 진이 다 빠져서...\n비슷한 분 있으면 얘기 나눠보고 싶어요.',
    likeCount: 24,
    commentCount: 3,
  },
  {
    id: '2',
    author: '별자리덕후',
    avatarInitial: '별',
    avatarTintIndex: 1,
    mbti: 'ENTJ',
    iljuLabel: '갑자일주',
    timeAgo: '40분 전',
    title: '일주 궁합 진짜 잘 맞는듯',
    preview: '친구랑 저랑 일주 궁합 봤는데 소름 돋았어요...',
    body: '친구랑 저랑 일주 궁합 봤는데 소름 돋았어요.\n서로 다른 점이 오히려 잘 맞는 느낌?',
    likeCount: 51,
    commentCount: 19,
  },
  {
    id: '3',
    author: '조용한물고기',
    avatarInitial: '조',
    avatarTintIndex: 2,
    mbti: 'ISTP',
    iljuLabel: '신묘일주',
    timeAgo: '1시간 전',
    title: '오늘 하루 어떠셨나요',
    preview: '그냥 아무 얘기나 하고 싶어서 써봐요...',
    body: '그냥 아무 얘기나 하고 싶어서 써봐요.',
    likeCount: 6,
    commentCount: 1,
  },
];

export type Comment = {
  id: string;
  author: string;
  mbti?: string;
  body: string;
  depth: 0 | 1;
};

export const commentsByPostId: Record<string, Comment[]> = {
  '1': [
    { id: 'c1', author: '별자리덕후', mbti: 'ENTJ', body: '저도 완전 공감이에요 ㅠㅠ', depth: 0 },
    { id: 'c2', author: '조용한물고기', body: '저희 완전 똑같네요', depth: 1 },
    { id: 'c3', author: '고요한파도', body: '일주 보면 그런 성향 많더라구요', depth: 0 },
  ],
};
