const API_KEY = '10b2022e211285373835bcfe6dd58901cfd2c14f1e1d63224f2afb0494eaa517';

const BASE_URLS = {
  en: 'https://apis.data.go.kr/B551011/EngService2',
  ja: 'https://apis.data.go.kr/B551011/JpnService2',
  zh: 'https://apis.data.go.kr/B551011/ChsService2',
};

// 검색에 사용할 한국어 키워드 (API는 언어 무관하게 한국어 검색 지원)
const KEYWORDS = {
  sosu:   '소수서원',
  buseok: '부석사',
  museom: '무섬마을',
};

// 언어×장소 조합별 캐시
const cache = {};

export async function fetchSpotInfo(lang, spotId) {
  if (lang === 'ko' || !BASE_URLS[lang]) return null;

  const cacheKey = `${lang}_${spotId}`;
  if (cache[cacheKey] !== undefined) return cache[cacheKey];

  const params = new URLSearchParams({
    serviceKey: API_KEY,
    numOfRows:  '3',
    pageNo:     '1',
    MobileOS:   'ETC',
    MobileApp:  'YeongjuDRT',
    _type:      'json',
    keyword:    KEYWORDS[spotId],
    areaCode:   '37',   // 경북
  });

  try {
    const res = await fetch(
      `${BASE_URLS[lang]}/searchKeyword2?${params}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const items = data?.response?.body?.items?.item;
    const item  = Array.isArray(items) ? items[0] : items;
    if (!item) { cache[cacheKey] = null; return null; }

    const result = {
      name:      item.title     || null,
      addr:      item.addr1     || null,
      contentId: item.contentid || null,
    };
    cache[cacheKey] = result;
    return result;
  } catch (e) {
    console.warn(`[TourAPI] ${lang}/${spotId}:`, e.message);
    cache[cacheKey] = null;  // 실패도 캐시해서 반복 요청 방지
    return null;
  }
}

/** 3개 관광지 정보를 병렬 요청, { sosu, buseok, museom } 맵 반환 */
export async function fetchAllSpots(lang) {
  if (lang === 'ko') return {};
  const ids = ['sosu', 'buseok', 'museom'];
  const results = await Promise.all(ids.map((id) => fetchSpotInfo(lang, id)));
  return Object.fromEntries(ids.map((id, i) => [id, results[i]]));
}
