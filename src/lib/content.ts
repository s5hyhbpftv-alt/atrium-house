export const rooms = [
  {
    id: "house",
    index: "01",
    place: "Дом",
    title: "Весь объём",
    copy: "Смотрите сразу целиком: крылья, крыша, двор, лес вокруг. Дом не прячется за кадром — он стоит, как его потом сдадут.",
    image: "/images/house.webp",
    lq: "/images/house.lq.webp",
  },
  {
    id: "living",
    index: "02",
    place: "Гостиная",
    title: "Очаг",
    copy: "Вечером огонь и лес за стеклом — будто сидите на опушке, только тепло. Голоса не гуляют эхом, диван не смотрит в телевизор, он смотрит в кроны.",
    image: "/images/living.webp",
    lq: "/images/living.lq.webp",
  },
  {
    id: "kitchen",
    index: "03",
    place: "Кухня",
    title: "Ритм утра",
    copy: "Камень острова холодный на ладонь. Вода, газ и вытяжка спрятаны в каркас: готовка без шума и запаха по дому. Завтрак — и уже виден двор.",
    image: "/images/kitchen.webp",
    lq: "/images/kitchen.lq.webp",
  },
  {
    id: "bedroom",
    index: "04",
    place: "Спальня",
    title: "Тишина",
    copy: "Здесь дом выдыхает. Стены не пропускают кухню, шторы сами гасят свет, воздух не сушит кожу. Утром — только лес, без будильника с соседней комнаты.",
    image: "/images/bedroom.webp",
    lq: "/images/bedroom.lq.webp",
  },
  {
    id: "kids",
    index: "05",
    place: "Детская",
    title: "Своё окно",
    copy: "Окно в кроны, тёплый пол, полки под рост. Можно шуметь — стены держат. Вечером лампа у кровати, утром — свой свет, не общий коридор.",
    image: "/images/kids.webp",
    lq: "/images/kids.lq.webp",
  },
  {
    id: "study",
    index: "06",
    place: "Кабинет",
    title: "Дверь мягко",
    copy: "Стол к лесу, книги в нише, дверь, которая закрывается без хлопка. Здесь думается. Никто не проходит насквозь — это не проходная.",
    image: "/images/study.webp",
    lq: "/images/study.lq.webp",
  },
  {
    id: "closet",
    index: "07",
    place: "Гардеробная",
    title: "Всё на местах",
    copy: "Свет зажигается сам. Пальто, чемоданы, утро без поиска. Никаких стульев с одеждой в спальне — дому не нужно выглядеть как примерочная.",
    image: "/images/closet.webp",
    lq: "/images/closet.lq.webp",
  },
  {
    id: "bath",
    index: "08",
    place: "Ванная",
    title: "Камень греет",
    copy: "Ступни на тёплом камне, душ как дождь, ванна к окну. Пар уходит в рекуперацию, не в коридор. После леса — вода, и снова тишина.",
    image: "/images/bath.webp",
    lq: "/images/bath.lq.webp",
  },
  {
    id: "spa",
    index: "09",
    place: "Спа",
    title: "Жар и вода",
    copy: "Сауна, вода, лес в окошке. Не отель — свой ритуал. Вышли, легли на тёплый пол, и дом ещё держит тепло, когда уже спите.",
    image: "/images/spa.webp",
    lq: "/images/spa.lq.webp",
  },
  {
    id: "toilet",
    index: "10",
    place: "Туалет",
    title: "Отдельно",
    copy: "Своя комната, не совмещённая с ванной. Дверь глухая, вентиляция тихая, свет мягкий. Гости не ищут его по дому — он на своём месте.",
    image: "/images/toilet.webp",
    lq: "/images/toilet.lq.webp",
  },
] as const;

export const facades = [
  { id: "0", place: "Фасад", title: "0°", copy: "", image: "/images/orbit-0.webp", lq: "/images/orbit-0.webp" },
  { id: "1", place: "Четверть", title: "45°", copy: "", image: "/images/orbit-1.webp", lq: "/images/orbit-1.webp" },
  { id: "2", place: "Торец", title: "90°", copy: "", image: "/images/orbit-2.webp", lq: "/images/orbit-2.webp" },
  { id: "3", place: "Задняя четверть", title: "135°", copy: "", image: "/images/orbit-3.webp", lq: "/images/orbit-3.webp" },
  { id: "4", place: "Сзади", title: "180°", copy: "", image: "/images/orbit-4.webp", lq: "/images/orbit-4.webp" },
  { id: "5", place: "Левый двор", title: "225°", copy: "", image: "/images/orbit-5.webp", lq: "/images/orbit-5.webp" },
  { id: "6", place: "Окно", title: "270°", copy: "", image: "/images/orbit-6.webp", lq: "/images/orbit-6.webp" },
  { id: "7", place: "Подъезд", title: "315°", copy: "", image: "/images/orbit-7.webp", lq: "/images/orbit-7.webp" },
] as const;

/** Landing after hero: same house as hero. 3D tour uses `facades`. */
export const homeFacades = [
  { id: "0", place: "Фасад", title: "0°", copy: "", image: "/images/house.webp", lq: "/images/house.webp" },
  { id: "1", place: "Четверть", title: "45°", copy: "", image: "/images/land-1.webp", lq: "/images/land-1.webp" },
  { id: "2", place: "Торец", title: "90°", copy: "", image: "/images/land-2.webp", lq: "/images/land-2.webp" },
  { id: "3", place: "Задняя четверть", title: "135°", copy: "", image: "/images/land-3.webp", lq: "/images/land-3.webp" },
  { id: "4", place: "Сзади", title: "180°", copy: "", image: "/images/land-4.webp", lq: "/images/land-4.webp" },
  { id: "5", place: "Левый двор", title: "225°", copy: "", image: "/images/land-5.webp", lq: "/images/land-5.webp" },
  { id: "6", place: "Окно", title: "270°", copy: "", image: "/images/land-6.webp", lq: "/images/land-6.webp" },
  { id: "7", place: "Подъезд", title: "315°", copy: "", image: "/images/land-7.webp", lq: "/images/land-7.webp" },
] as const;

export const planFloors = [
  {
    id: "0",
    name: "1 этаж",
    cells: [
      { id: "living", x: 2, y: 4, w: 46, h: 52 },
      { id: "kitchen", x: 50, y: 4, w: 48, h: 24 },
      { id: "study", x: 50, y: 30, w: 24, h: 26 },
      { id: "spa", x: 2, y: 58, w: 28, h: 38 },
      { id: "toilet", x: 32, y: 58, w: 16, h: 38 },
      { id: "bath", x: 50, y: 58, w: 48, h: 38 },
    ],
  },
  {
    id: "1",
    name: "2 этаж",
    cells: [
      { id: "bedroom", x: 2, y: 8, w: 48, h: 84 },
      { id: "closet", x: 52, y: 8, w: 46, h: 36 },
      { id: "kids", x: 52, y: 48, w: 46, h: 44 },
    ],
  },
] as const;

export const services = [
  {
    index: "01",
    title: "Разные дома",
    slug: "doma",
    lead: "Не каталог из одного фасада. Лесной, семейный, гостевой, каменный — под участок, не участок под картинку.",
    items: [
      "Индивидуальный проект под рельеф и свет",
      "Коробка, кровля, фасад, окна",
      "Сети внутри контура, не «потом электрики»",
      "Умный дом закладывается в щит",
    ],
  },
  {
    index: "02",
    title: "Ремонт домов",
    slug: "remont-domov",
    lead: "Капитальный ремонт и реконструкция загородного дома. Сначала инженерия, потом камень и дерево.",
    items: [
      "Диагностика тепла, щита, влажности",
      "Замена сетей без косметики поверх гнили",
      "Мокрые зоны, сауна, кухни, гардеробные",
      "Работа очередями, если в доме живут",
    ],
  },
  {
    index: "03",
    title: "Ремонт квартир",
    slug: "remont-kvartir",
    lead: "Городская квартира — не уменьшенный дом. Тихие стояки, свой щит, материалы как в лесу.",
    items: [
      "Новостройка и вторичка",
      "Перепланировка по закону",
      "Звук, мокрые зоны, свет",
      "Умный дом без одноразового облака",
    ],
  },
  {
    index: "04",
    title: "Все коммуникации",
    slug: "voda",
    lead: "Прокладка и обслуживание по типам: вода, стоки, тепло, электрика, воздух, газ. Не «инженерия пакетом».",
    items: [
      "Водоснабжение и фильтрация",
      "Канализация, септик, ливнёвка",
      "Отопление и котельная",
      "Электрика, вентиляция, газ, сервис",
    ],
  },
  {
    index: "05",
    title: "Умный дом",
    slug: "umnyi-dom",
    lead: "Нервная система, не колонка на кухне. Свет, климат, шторы, охрана — из щита, который собрали вместе со стенами.",
    items: [
      "Проводной позвоночник, радио только где нужно",
      "Сценарии: дома, ушли, ночь, лес, гости, отпуск",
      "Квартира и дом — разные схемы, один интерфейс",
      "Сервис логики после ключей",
    ],
  },
] as const;

export const steps = [
  {
    index: "01",
    title: "Участок",
    copy: "Выезд, рельеф, вводы, ограничения. Фиксируем бюджет до котлована.",
  },
  {
    index: "02",
    title: "Проект",
    copy: "Архитектура и инженерия вместе, чтобы сети не ломали интерьер.",
  },
  {
    index: "03",
    title: "Коробка",
    copy: "Фундамент, стены, кровля, контур тепла.",
  },
  {
    index: "04",
    title: "Сети",
    copy: "Электрика, вода, тепло, воздух, слаботочка — до отделки.",
  },
  {
    index: "05",
    title: "Отделка",
    copy: "Материалы, свет, столярка, мокрые зоны.",
  },
  {
    index: "06",
    title: "Сервис",
    copy: "Пуск, настройка сценариев, гарантия и сезонное обслуживание.",
  },
] as const;

export const serviceOptions = [
  "Разные дома под ключ",
  "Ремонт дома",
  "Ремонт квартиры",
  "Вода и канализация",
  "Отопление и воздух",
  "Электрика",
  "Умный дом",
  "Обслуживание сетей",
] as const;
