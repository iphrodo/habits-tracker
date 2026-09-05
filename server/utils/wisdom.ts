export interface Wisdom {
  id: string
  japanese: string
  romaji: string
  translation: string
  reflection: string
  source: string
  sourceLabel: string
}

const source = 'https://en.wikipedia.org/wiki/Japanese_proverbs'
const sourceLabel = 'Japanese proverbs · довідка'

const entries: [string, string, string, string, string][] = [
  ['nana-korobi-yaoki', '七転び八起き', 'Nana korobi yaoki', '«Сім разів упади — вісім разів підведися».', 'Сьогодні достатньо підвестися ще раз.',],
  ['keizoku-chikara', '継続は力なり', 'Keizoku wa chikara nari', '«Послідовність стає силою».', 'Твій тихий щоденний вибір уже має вагу.',],
  ['ame-tare', '雨垂れ石を穿つ', 'Amadare ishi o ugatsu', '«Крапля води пробиває камінь».', 'Малі дії стають незворотним рухом.',],
  ['ishi-sannen', '石の上にも三年', 'Ishi no ue ni mo sannen', '«Навіть на камені сидять три роки».', 'Терпіння робить незвичне звичним.',],
  ['shoshin', '初心忘るべからず', 'Shoshin wasuru bekarazu', '«Не забувай початкового наміру».', 'Згадай, для чого ти почав цей шлях.',],
  ['kyo-asu', '今日の後に明日あり', 'Kyō no nochi ni ashita ari', '«Після сьогодні є завтра».', 'Проживи цей день; наступний прийде сам.',],
  ['ichi-nichi', '一日一歩', 'Ichinichi ippo', '«Один крок щодня».', 'Не треба пройти весь шлях за одну мить.',],
  ['kokorozashi', '志は高く', 'Kokorozashi wa takaku', '«Тримай намір високо».', 'Твоя ціль більша за сьогоднішнє бажання.',],
  ['makenu', '負けるが勝ち', 'Makeru ga kachi', '«Поступитися — теж перемога».', 'Не сперечайся з потягом: дай йому минути.',],
  ['fukou', '不幸中の幸い', 'Fukō chū no saiwai', '«Щастя навіть посеред невдачі».', 'У складній хвилині все одно є вибір на твою користь.',],
  ['nana-kusa', '習うより慣れよ', 'Narau yori nareyo', '«Звикай, а не лише вчися».', 'Новий ритм стає природним через повторення.',],
  ['tadaima', '只今がその時', 'Tadaima ga sono toki', '«Саме зараз — той час».', 'Не чекай ідеального моменту для турботи про себе.',],
  ['seijaku', '静かなるは強し', 'Shizuka naru wa tsuyoshi', '«Спокійний — сильний».', 'Тиша в тобі може бути твоєю опорою.',],
  ['hyaku-ri', '千里の道も一歩から', 'Senri no michi mo ippo kara', '«Шлях у тисячу рі починається з кроку».', 'Твій перший крок уже став багатьма днями.',],
  ['kaze', '風は吹く', 'Kaze wa fuku', '«Вітер минає».', 'Бажання приходить хвилею і так само відходить.',],
  ['hikari', '闇の後には光がある', 'Yami no ato ni wa hikari ga aru', '«Після темряви є світло».', 'Складний момент не описує весь твій день.',],
  ['nintai', '忍耐は苦いが実は甘い', 'Nintai wa nigai ga mi wa amai', '«Терпіння гірке, та його плід солодкий».', 'Ти вже створюєш результат, якого ще не видно.',],
  ['kibou', '希望は心の灯火', 'Kibō wa kokoro no tomoshibi', '«Надія — ліхтар серця».', 'Бережи маленьке світло, яке привело тебе сюди.',],
  ['mizu', '水は方円の器に随う', 'Mizu wa hōen no utsuwa ni shitagau', '«Вода набуває форми посудини».', 'Зміни оточення — і нова звичка матиме простір.',],
  ['jibun', '自分に勝つ', 'Jibun ni katsu', '«Перемогти себе».', 'Це не бій з тобою, а вибір на твою користь.',],
  ['kokoro', '心を整える', 'Kokoro o totonoeru', '«Упорядкувати серце».', 'Один повільний вдих уже повертає тобі опору.',],
  ['yukkuri', '急がば回れ', 'Isogaba maware', '«Поспішаєш — йди в обхід».', 'Повільна, надійна відповідь сильніша за імпульс.',],
  ['haru', '冬来たりなば春遠からじ', 'Fuyu kitarinaba haru tōkaraji', '«Якщо прийшла зима, весна недалеко».', 'Витримай цю хвилину — і вона зміниться.',],
  ['asatte', '明日は明日の風が吹く', 'Ashita wa ashita no kaze ga fuku', '«Завтра дутиме завтрашній вітер».', 'Сьогодні не треба вирішувати все майбутнє.',],
  ['fuku', '福は内', 'Fuku wa uchi', '«Щастя всередину».', 'Впусти в цей день трохи доброти до себе.',],
  ['michi', '道は開ける', 'Michi wa hirakeru', '«Шлях відкривається».', 'Кожне твоє рішення робить наступне трохи легшим.',],
  ['aki', '実るほど頭を垂れる稲穂かな', 'Minoru hodo kōbe o tareru inaho kana', '«Чим повніший колос, тим нижче він схиляється».', 'Сила не потребує показовості.',],
  ['yorokobi', '笑う門には福来る', 'Warau kado ni wa fuku kitaru', '«До оселі зі сміхом приходить щастя».', 'Дай собі один невеликий привід усміхнутися.',],
  ['sonae', '備えあれば憂いなし', 'Sonae areba urei nashi', '«Є підготовка — менше тривоги».', 'Підготуй воду, прогулянку або повідомлення другу на складний момент.',],
  ['ichigo', '一期一会', 'Ichigo ichie', '«Одна зустріч — один шанс».', 'Цей день неповторний, і ти проживаєш його вільно.',],
]

export const WISDOM_CATALOG: Wisdom[] = entries.map(([id, japanese, romaji, translation, reflection]) => ({ id, japanese, romaji, translation, reflection, source, sourceLabel }))

export function dateKeyInTimezone(timezone: string, now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function wisdomForDate(localDate: string): Wisdom {
  const day = Math.floor(Date.parse(`${localDate}T00:00:00Z`) / 86_400_000)
  return WISDOM_CATALOG[((day % WISDOM_CATALOG.length) + WISDOM_CATALOG.length) % WISDOM_CATALOG.length]!
}
