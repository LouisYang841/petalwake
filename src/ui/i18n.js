// Language: the game is written in English, and speaks Chinese first. The English text is the key:
// t('Take off') looks the line up in the Chinese table below and returns it untouched when it is
// not there (or when English is chosen), so a missing entry can only ever fall back to the original.
//
// The choice lives in localStorage (`petalwake.lang`), `?lang=en` overrides it for one visit.
// Switching reloads the page: the whole UI is rebuilt from these strings at boot, and reloading is
// what the graphics settings already do.

const LANG_KEY = 'petalwake.lang';

const stored = (() => {
  try { return localStorage.getItem(LANG_KEY); } catch { return null; }
})();
const asked = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('lang') : null;

/** 'zh' (default) or 'en'. */
export const lang = asked === 'en' || asked === 'zh' ? asked : (stored === 'en' ? 'en' : 'zh');

/** Translate an English line. `vars` fills {placeholders} after the lookup. */
export function t(text, vars) {
  let s = lang === 'zh' && Object.hasOwn(ZH, text) ? ZH[text] : text;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

/** Proper nouns from the data files (places, pads, towns) go through the same table. */
export const tn = t;

/** Switch language and start again in it. */
export function setLang(next) {
  if (next !== 'zh' && next !== 'en') return;
  try { localStorage.setItem(LANG_KEY, next); } catch { /* private browsing: the visit keeps it */ }
  const url = new URL(location.href);
  url.searchParams.delete('lang');
  location.replace(url.href);
}

/** Apply the choice to the static markup (everything with data-i18n* on it). */
export function applyStatic(root = document) {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
}

/** The little 中文 / English switch on the title screen. */
export function mountLangToggle(parent = document.querySelector('#title .title-inner')) {
  if (!parent || parent.querySelector('.lang-switch')) return;
  const box = document.createElement('div');
  box.className = 'lang-switch';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', '语言 / Language');
  box.innerHTML = `<button type="button" data-lang="zh" aria-pressed="${lang === 'zh'}">中文</button><button type="button" data-lang="en" aria-pressed="${lang === 'en'}">English</button>`;
  parent.append(box);
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-lang]');
    if (b && b.dataset.lang !== lang) setLang(b.dataset.lang);
  });
}

// ------------------------------------------------------------------------------------ the table
const ZH = {
  // ---- title screen
  'a broom, an island, a good wind': '一把扫帚，一座岛，一阵好风',
  'gathering the wind…': '正在聚拢风……',
  'raising the island…': '正在升起岛屿……',
  'sowing the meadows…': '正在播撒草甸……',
  'painting the sky…': '正在描绘天空……',
  'waking the broom…': '正在唤醒扫帚……',
  'failed to load: {msg}': '加载失败：{msg}',
  'Take off': '起飞',
  'Drag the left stick to steer. Hold Boost or Brake.': '拖动左侧摇杆控制方向，按住加速或刹车。',
  'Double-tap Brake to land; tap once to take off.': '双击刹车降落；单点刹车起飞。',

  // ---- the keys list on the title screen
  'dive · climb': '俯冲 · 爬升',
  bank: '侧倾',
  'ride the gust': '乘风',
  'ease up': '收力',
  steer: '转向',
  camera: '视角',
  'invert pitch': '反转俯仰',
  'hide HUD': '隐藏界面',
  mute: '静音',
  journal: '手记',

  // ---- HUD
  gust: '风势',
  kickflip: '翻板',
  'parcel for': '包裹送往',
  delivered: '已送达',
  'nearest wind seed': '最近的风之种',
  'where the parcel is going': '包裹要送去的地方',
  'camera · {mode}': '视角 · {mode}',
  'pitch inverted': '俯仰已反转',
  'pitch normal': '俯仰已归正',
  'sound off': '已静音',
  'sound on': '声音已开',
  'every seed caught — the whole island is on the wind': '集齐了所有风之种——整座岛都在风里了',
  'a wind seed — there are more out there': '一颗风之种——外面还有更多',
  '{n} seeds still adrift': '还有 {n} 颗风之种在飘荡',

  // ---- camera modes
  chase: '跟拍',
  low: '低机位',
  far: '远景',

  // ---- the journal
  '/ {total} treasures': '/ {total} 件宝藏',
  'Treasures {n}/{total}': '宝藏 {n}/{total}',
  'treasure found': '发现宝藏',
  "the rider's journal": '骑手的手记',
  'Treasures of the island': '岛上的宝藏',
  'all {total} found': '已找到全部 {total} 件',
  '{n} of {total} found': '已找到 {n} / {total}',
  'Not yet found': '尚未寻得',
  'Somewhere on the island.': '岛上某处。',
  close: '关闭',
  'every treasure found — the island has no secrets left': '所有宝藏都已寻得——这座岛再没有秘密了',

  // ---- errands and the landing prompts
  'to take off': '起飞',
  'coming in to': '正在驶向',
  'breaks off': '中止',
  'to land': '降落',
  'land on a tower': '在塔顶降落',
  'Kickflip unlocked: press Q': '解锁翻板：按 Q',
  'rest stop': '歇脚',
  'the parcel is for {name} · {dist}': '包裹送往 {name} · {dist}',
  'parcel no. {n}': '第 {n} 号包裹',
  'parcel no. {n} · the next is for {name}, {dist} off': '第 {n} 号包裹 · 下一件送往 {name}，还有 {dist}',
  'follow the gold light · Space twice by a pad to land': '跟着金光飞 · 在平台上空连按两次空格降落',
  'a parcel for': '这件包裹送给',

  // ---- settings
  Settings: '设置',
  Language: '语言',
  'Graphics settings': '画面设置',
  'Close settings': '关闭设置',
  'Lower resolution, meadow density and particle budgets reduce rendering work. Ultra-low also skips clouds and shore decoration.': '调低分辨率、草甸密度和粒子预算可以减少渲染负担；超低画质还会跳过云与岸边装饰。',
  Preset: '预设',
  Custom: '自定义',
  'Ultra-low': '超低',
  Low: '低',
  Medium: '中',
  High: '高',
  'Render scale': '渲染比例',
  '100% uses your screen’s native resolution. 50% uses half the width and height, rendering a quarter as many pixels. Adaptive resolution can lower this further.': '100% 使用屏幕的原生分辨率；50% 时宽高各减半，只渲染四分之一的像素。自适应分辨率还会进一步降低。',
  'Frame limit': '帧率上限',
  Unlimited: '不限',
  'Grass and flowers': '草地与花',
  Minimal: '极简',
  'Particle budget': '粒子预算',
  'Anti-aliasing (MSAA)': '抗锯齿（MSAA）',
  Off: '关',
  On: '开',
  'Adaptive resolution': '自适应分辨率',
  Bloom: '泛光',
  'Sun rays': '阳光射线',
  'Motion blur': '动态模糊',
  'Water reflections': '水面反射',
  'Rider shadow': '骑手阴影',
  Clouds: '云',
  'Shore decoration': '岸边装饰',
  'Graphics changes restart the game and are saved on this device.': '画面改动会重启游戏，并保存在这台设备上。',
  'Save & restart': '保存并重启',
  'Storage is unavailable. Allow browser storage to save graphics settings.': '存储不可用。请允许浏览器存储以保存画面设置。',

  // ---- touch controls
  'Drag to bank, up to climb, down to dive': '拖动侧倾，向上爬升，向下俯冲',
  Boost: '加速',
  Brake: '刹车',
  '2× land': '双击降落',
  Camera: '视角',
  Flip: '翻板',
  Journal: '手记',

  // ---- towns and regions
  Larkhaven: '云雀港',
  Cairnwick: '石冢村',
  'The Meadows': '草甸',
  "Wren's Crown": '鹪鹩之冠',
  'Hollowmere Sound': '空湖湾',
  'Lace Bay': '蕾丝湾',
  'The Sisters': '姐妹礁',
  'The Shale Coast': '页岩海岸',
  'The Open Blue': '无垠蔚蓝',
  'Mount Wren': '鹪鹩山',
  Longstrand: '长滩',
  'Lantern Head': '灯塔岬',
  'Cosmos Down': '秋英坡',
  'The Westbowl': '西碗谷',
  Southmeadow: '南草甸',

  // ---- landing pads, Larkhaven
  "The Star-gazer's Tower": '观星塔',
  'The Hill Gate': '山门',
  "The Couriers' Guild": '信使公会',
  'Larkhaven Town Hall': '云雀港镇公所',
  'The Chapel Bell Tower': '礼拜堂钟楼',
  "Harbourmaster's Tower": '港务长塔',
  "The Huer's Lookout": '渔汛瞭望台',
  'Larkhaven Customs House': '云雀港海关',
  'The Terrace Tea House': '台地茶屋',
  'The Shot Tower': '铅弹塔',
  "The Carrier's Deck": '搬运工平台',
  "The Crow's Nest": '桅顶瞭望台',
  "The Notary's Stair": '公证人阶梯',
  "The Dyers' Drying Tower": '染坊晾布塔',
  "The Warden's Tower-house": '管事塔屋',
  'The Dovecote': '鸽舍',
  'The Lookout': '瞭望台',
  'The Old Keep Hostel': '旧堡旅舍',
  "The Notary's Tower-house": '公证人塔屋',
  'The Cistern Tower': '蓄水塔',
  "The Pilot's Tower-house": '领航员塔屋',
  "The Scholars' Library": '学者图书馆',
  'The Lamp House': '灯屋',
  'The Harbour Light': '港口灯塔',

  // ---- landing pads, Cairnwick and the meadows
  'Cairnwick Signal Tower': '石冢信号塔',
  "Whale-watchers' Lookout": '观鲸台',
  'Cairnwick Wind Pump': '石冢风泵',
  'The Last Lantern': '最后一盏灯',
  'The Weather House': '气象屋',
  'Twin Cowls Oast': '双罩烘麦房',
  'Pippin Cote': '皮平鸽舍',
  'Whitecap Mill': '白浪磨坊',
  'Harrow Beacon': '哈罗烽火台',
  'The Candle Stump': '烛桩',
  "Heron's Perch": '苍鹭栖架',

  // ---- the spots on each pad
  'Signal gallery': '信号廊',
  'Lookout stage': '瞭望台',
  'Pump stage': '风泵平台',
  'Roof gallery': '屋顶回廊',
  'Roof walk': '屋顶步道',
  'Loading platform': '装卸平台',
  'Alighting ledge': '落脚檐',
  'Mill stage': '磨坊平台',
  'Beacon top': '塔顶',
  'Wall-head': '墙头',
  "Crow's nest": '桅顶',
  'Dome gallery': '穹顶回廊',
  'Gate wall-walk': '城门步道',
  "Couriers' Guild gallery": '信使回廊',
  'Town hall belfry gallery': '镇公所钟廊',
  'Chapel bell tower belfry': '钟楼钟室',
  "Harbourmaster's gallery": '港务长廊',
  'Customs House walk': '海关步道',
  'Tea house roof terrace': '茶屋天台',
  'Library balcony': '图书馆阳台',
  'The lamp walk': '灯之步道',
  'Hoist stage': '吊装平台',
  "Carrier's deck": '搬运平台',
  "Notary's leads": '公证人铅顶',
  'Wind deck': '风台',
  "Warden's terrace": '管事露台',
  'Lantern walk': '灯廊',
  'The lookout': '瞭望台',
  'Hostel veranda': '旅舍游廊',
  'Turret gallery': '角楼回廊',
  'Cistern roof': '蓄水塔顶',

  // ---- the hidden places
  'The Blossom Sister': '花之姐妹',
  'One of the Sisters, north of the shale coast, wears pink in every season.': '页岩海岸以北的姐妹礁里，有一座终年披着粉色。',
  'Farewell Bridge': '告别桥',
  'Where the river takes its last step before the fall, something purple hangs over the water.': '河流在坠下瀑布前的最后一步，水面上悬着一抹紫色。',
  'The Shipless Mast': '无船之桅',
  'On the spine of Lantern Head a mast still flies its colours, with no ship beneath it.': '灯塔岬的山脊上，一根桅杆仍挂着旗，脚下却没有船。',
  'The Wreck of the Marigold': '金盏花号残骸',
  'A little blue boat came ashore on the Longstrand long ago, and has been in flower ever since.': '很久以前，一艘小蓝船搁浅在长滩上，从此那里一直在开花。',
  'The Clock Meadow': '时钟草甸',
  'In the Westbowl the dandelions have grown taller than a rider, and they still keep the time.': '西碗谷的蒲公英长得比骑手还高，却仍在守着时辰。',
  'The Open Hand': '摊开的手',
  'On the western cliffs a hand of stone is still held out to the sea.': '西边悬崖上，一只石手仍朝大海摊开。',
  'The Thousand-Wish Pine': '千愿松',
  "High on the mountain's western shoulder, something flutters that is not leaves.": '高山西肩之上，有什么在飘动，却不是树叶。',
  'The Kettle Pools': '汤池',
  'In a green fold of the eastern foothills the hillside keeps a staircase of warm blue water.': '东麓的一处绿色褶皱里，山坡盛着一阶阶温暖的蓝水。',
  Starfall: '坠星地',
  'Something fell on the north-east meadow long ago. It took a bite out of the cliff on the way in.': '很久以前，有东西落在东北的草甸上，撞进来时在悬崖上咬掉了一口。',
  'The Conch Garden': '海螺花园',
  'The smallest island keeps the largest shell, and somebody has been gardening around it.': '最小的岛守着一只最大的海螺，还有人一直在它周围打理花园。',
  'Lantern Roots': '灯根',
  'One tree went wading into the lagoon and never came back. Somebody still lights its lamps.': '一棵树走进潟湖，再没回来，还有人替它点着灯。',
  'The Whalebone Arbour': '鲸骨凉棚',
  'On the long south-east beach a great traveller rests, and thrift grows where it sang.': '东南长滩上，一位伟大的旅人安睡着，它歌唱过的地方长出了海石竹。',

  // ---- the treasures
  'The Unspilled Cup': '不洒之杯',
  'However the gale howls around the Sister, the tea in this cup has never so much as rippled.': '无论姐妹礁周围的风刮得多凶，杯里的茶从未起过一丝涟漪。',
  'Thimble of the First Rain': '初雨顶针',
  'Still brimming with the first rain that ever fell on the island. It has been trying to reach the sea ever since.': '里面盛着这座岛落下的第一场雨，至今仍满；从那以后，它一直想流进大海。',
  'The Gale-Whistle': '狂风哨',
  'Blow it once and the wind remembers your name. Blow it twice and it comes looking for you.': '吹一声，风会记住你的名字；吹两声，风会来找你。',
  'The Seven-Tide Knot': '七潮结',
  'Seven tides were tied into this rope by someone who wanted the sea to stay. Nobody has dared to undo it.': '有人想让大海留下来，把七次潮水打进了这根绳结。至今没人敢解开。',
  'The Hour That Got Away': '溜走的一小时',
  'A brass hourglass whose sand runs upward, very slowly. Nobody has ever seen it finish.': '一只黄铜沙漏，沙子极慢地向上流，从没人见过它流完。',
  'The Storm Marble': '风暴弹珠',
  'A glass marble with a thunderstorm the size of a thumbnail inside. The giant lost the game and kept the prize.': '一颗玻璃弹珠，里面装着拇指大的雷暴。巨人输了游戏，却留下了奖品。',
  "The Windwright's Bell": '风匠之铃',
  'A thumb-worn bronze bell with no clapper. The pine rings it anyway, on nights when the wind changes its mind.': '一只被拇指磨旧的铜铃，没有铃舌；在风改了主意的夜里，松树会替它摇响。',
  'The Ember Egg': '余烬蛋',
  'A river stone that has never once gone cold. Shepherds carried it in their coats through seven winters and argued over whose turn it was.': '一块从未冷过的河石。牧人揣在大衣里熬过七个冬天，还为轮到谁揣着争吵不休。',
  'The Sky Splinter': '天穹碎片',
  'A sliver of the star that fell here. Hold it to your ear and it is still humming the note it made coming down.': '那颗坠落之星的碎片。贴到耳边，它仍在哼着坠落时的那个音。',
  'The Moon Pearl': '月珠',
  'Grown over a hundred years of tides around one grain of sand that the full moon happened to be shining on.': '百年潮水层层裹着一粒沙长成——那晚满月恰好照在它身上。',
  'The Ferrylight': '渡灯',
  'The lamp of a ferry that ran before there was a town to run to. It has only ever needed lighting once.': '一盏渡船的灯，那时还没有可去的镇子；它只需要被点着一次。',
  'The Song Bone': '歌骨',
  "A whale's ear-bone, sanded smooth by the tides. On a still evening it gives back the songs it heard, very slowly.": '鲸的耳骨，被潮水磨得光滑。寂静的傍晚，它会极慢地回放听过的歌。',
};
