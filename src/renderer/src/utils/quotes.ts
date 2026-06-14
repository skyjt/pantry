// 主界面空态的随机名人名言（决议 #82）。纯本地内置，绝无任何外网请求（纯内网原则）。
// 每次打开软件随机展示一条。

export interface Quote {
  text: string
  author: string
}

export const QUOTES: Quote[] = [
  { text: '三人行，必有我师焉。', author: '孔子' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '天行健，君子以自强不息。', author: '《周易》' },
  { text: '不积跬步，无以至千里。', author: '荀子' },
  { text: '海内存知己，天涯若比邻。', author: '王勃' },
  { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白' },
  { text: '会当凌绝顶，一览众山小。', author: '杜甫' },
  { text: '读书破万卷，下笔如有神。', author: '杜甫' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '《警世贤文》' },
  { text: '谁言寸草心，报得三春晖。', author: '孟郊' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '富贵不能淫，贫贱不能移，威武不能屈。', author: '孟子' },
  { text: '人生自古谁无死，留取丹心照汗青。', author: '文天祥' },
  { text: '落红不是无情物，化作春泥更护花。', author: '龚自珍' },
  { text: '千淘万漉虽辛苦，吹尽狂沙始到金。', author: '刘禹锡' },
  { text: '我思故我在。', author: '笛卡尔' },
  { text: '知识就是力量。', author: '培根' },
  { text: '想象力比知识更重要。', author: '爱因斯坦' },
  { text: '天才是百分之一的灵感，加上百分之九十九的汗水。', author: '爱迪生' },
  { text: '凡是过往，皆为序章。', author: '莎士比亚' },
  { text: '生活就像海洋，只有意志坚强的人才能到达彼岸。', author: '马克思' }
]

export function randomQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)] ?? QUOTES[0]
}
