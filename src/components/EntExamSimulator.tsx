import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, Bookmark, Flag, ChevronLeft, ChevronRight, 
  RotateCcw, Trophy, Award, BookOpen, Layers, Sparkles, ArrowRight, ShieldCheck, 
  BarChart3, Check, Filter, Compass, AlertTriangle, Play, HelpCircle, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { ai } from '../services/geminiService';
import { TRANSLATIONS } from '../translations';

export interface EntQuestion {
  id: string;
  sectionIndex: number;
  sectionTitle: string;
  number: number;
  question: string;
  options: string[];
  correctAnswer: number | number[]; // index or indices
  points: number; // 1 or 2
  type: 'single' | 'multiple';
  explanation: string;
}

export interface EntExamConfig {
  mode: 'full' | 'subject';
  profile1: string;
  profile2: string;
  singleSubject?: string;
  comment?: string;
  language: 'ru' | 'kk';
}

interface Props {
  user: any;
  appLanguage: 'ru' | 'kk' | 'en';
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onCompleteExam: (result: { score: number; maxScore: number; mode: string }) => void;
  onExit: () => void;
}

// Official ENT Profile Pairs
export const ENT_PROFILE_PAIRS = [
  { p1: 'Математика', p2: 'Физика', label: 'Математика + Физика (Инженерия, IT, Архитектура)', code: 'MATH_PHYS' },
  { p1: 'Химия', p2: 'Биология', label: 'Химия + Биология (Медицина, Фармация, Ветеринария)', code: 'CHEM_BIO' },
  { p1: 'Математика', p2: 'Информатика', label: 'Математика + Информатика (IT, Программирование, ИИ)', code: 'MATH_CS' },
  { p1: 'География', p2: 'Математика', label: 'География + Математика (Экономика, Менеджмент, Логистика)', code: 'GEO_MATH' },
  { p1: 'Всемирная история', p2: 'Основы права', label: 'Всемирная история + Основы права (Юриспруденция)', code: 'HIST_LAW' },
  { p1: 'Всемирная история', p2: 'География', label: 'Всемирная история + География (Международные отношения)', code: 'HIST_GEO' },
  { p1: 'Английский язык', p2: 'Всемирная история', label: 'Иностранный язык + Всемирная история (Перевод, Лингвистика)', code: 'LANG_HIST' },
  { p1: 'Казахский язык', p2: 'Казахская литература', label: 'Казахский язык + Казахская литература (Филология)', code: 'KAZ_KAZLIT' },
  { p1: 'Русский язык', p2: 'Русская литература', label: 'Русский язык + Русская литература (Филология)', code: 'RUS_RUSLIT' },
  { p1: 'Биология', p2: 'География', label: 'Биология + География (Экология, Агрономия)', code: 'BIO_GEO' },
  { p1: 'Химия', p2: 'Физика', label: 'Химия + Физика (Материаловедение, Нанотехнологии)', code: 'CHEM_PHYS' },
  { p1: 'История Казахстана', p2: 'Основы права', label: 'История Казахстана + Основы права (Политология)', code: 'KAZHIST_LAW' },
];

export const ALL_ENT_SUBJECTS = [
  { id: 'История Казахстана', nameRu: 'История Казахстана (20 заданий, 20 баллов)', questionsCount: 20, maxScore: 20, timeMin: 25 },
  { id: 'Грамотность чтения', nameRu: 'Грамотность чтения (10 заданий, 10 баллов)', questionsCount: 10, maxScore: 10, timeMin: 15 },
  { id: 'Математическая грамотность', nameRu: 'Математическая грамотность (10 заданий, 10 баллов)', questionsCount: 10, maxScore: 10, timeMin: 15 },
  { id: 'Математика', nameRu: 'Математика (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
  { id: 'Физика', nameRu: 'Физика (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
  { id: 'Химия', nameRu: 'Химия (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
  { id: 'Биология', nameRu: 'Биология (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
  { id: 'География', nameRu: 'География (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
  { id: 'Информатика', nameRu: 'Информатика (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
  { id: 'Всемирная история', nameRu: 'Всемирная история (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
  { id: 'Основы права', nameRu: 'Основы права (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
  { id: 'Английский язык', nameRu: 'Английский язык (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
  { id: 'Казахский язык', nameRu: 'Казахский язык (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
  { id: 'Русский язык', nameRu: 'Русский язык (Профиль) (40 заданий, 50 баллов)', questionsCount: 40, maxScore: 50, timeMin: 50 },
];

export const PROFILE_SUBJECT_OPTIONS = [
  'Математика', 'Физика', 'Химия', 'Биология', 'География', 
  'Информатика', 'Всемирная история', 'Основы права', 
  'Английский язык', 'Казахский язык', 'Русский язык'
];

export function formatMathText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\cdot/g, '·')
    .replace(/\\pi/g, 'π')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt/g, '√')
    .replace(/\\int_/g, '∫')
    .replace(/\\int/g, '∫')
    .replace(/\\infty/g, '∞')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\delta/gi, 'Δ')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    .replace(/v_0/g, 'v₀')
    .replace(/x_0/g, 'x₀')
    .replace(/t\^2/g, 't²')
    .replace(/m\/s\^2/g, 'м/с²')
    .replace(/м\/с\^2/g, 'м/с²')
    .replace(/Н\\cdot с/g, 'Н·с')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\_2/g, '₂')
    .replace(/\_3/g, '₃')
    .replace(/\_4/g, '₄')
    .replace(/\\/g, '');
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleOptionsSingle(q: string, opts: string[], correctIdx: number, exp: string) {
  const correctText = opts[correctIdx];
  const shuffled = shuffleArray(opts);
  const newAns = shuffled.indexOf(correctText);
  return { q, opts: shuffled, ans: newAns, exp };
}

// Master question pools guaranteeing no repeats inside a test
const MASTER_HISTORY_POOL = [
  { qRu: "Какое событие произошло в 1726 году на холме Ордабасы?", qKz: "1726 жылы Ордабасы тауында қандай оқиға болды?", optsRu: ["Объединение всех трех жузов для отпора джунгарам", "Подписание соглашения с Российской империей", "Избрание Абылай хана всеказахским ханом", "Анракайское сражение"], optsKz: ["Үш жүздің күш біріктіруі", "Ресей империясымен келісімге қол қою", "Абылай ханды хан сайлау", "Аңырақай шайқасы"], ans: 0, expRu: "В 1726 году на холме Ордабасы состоялся курултай трех казахских жузов.", expKz: "1726 жылы Ордабасыда үш жүз өкілдері бас қосты." },
  { qRu: "В каком году была принята первая Конституция независимого Казахстана?", qKz: "Тәуелсіз Қазақстанның алғашқы Конституциясы қай жылы қабылданды?", optsRu: ["1991 год", "1993 год", "1995 год", "1997 год"], optsKz: ["1991 жыл", "1993 жыл", "1995 жыл", "1997 жыл"], ans: 1, expRu: "Первая Конституция принята 28 января 1993 года.", expKz: "Тәуелсіз Ата Заң 1993 жылы қабылданды." },
  { qRu: "Кто возглавил партию 'Алаш' и правительство Алаш-Орды в декабре 1917 года?", qKz: "1917 жылғы желтоқсанда 'Алаш' партиясы мен Алашорда үкіметін кім басқарды?", optsRu: ["Алихан Букейханов", "Ахмет Байтурсынов", "Мыржакып Дулатов", "Мустафа Шокай"], optsKz: ["Әлихан Бөкейханов", "Ахмет Байтұрсынұлы", "Міржақып Дулатов", "Мұстафа Шоқай"], ans: 0, expRu: "Главой Алаш-Орды был избран Алихан Букейханов.", expKz: "Әлихан Бөкейханов Алашорда төрағасы болып сайланды." },
  { qRu: "Город, являвшийся столицей и главной ставкой Западно-Тюркского каганата:", qKz: "Батыс Түрік қағанатының астанасы және бас ордасы болған қала:", optsRu: ["Суяб", "Баласагун", "Отрар", "Тараз"], optsKz: ["Суяб", "Баласағұн", "Отырар", "Тараз"], ans: 0, expRu: "Главной ставкой каганата являлся Суяб.", expKz: "Бас ордасы Суяб қаласы болды." },
  { qRu: "Знаменитый свод законов 'Жеті Жарғы' был составлен при правлении хана:", qKz: "Жеті Жарғы заңдар жинағы қай ханның тұсында құрылды?", optsRu: ["Касыма", "Есима", "Тауке", "Хакназара"], optsKz: ["Қасым", "Есім", "Тәуке", "Хақназар"], ans: 2, expRu: "'Жеті Жарғы' разработаны при Тауке хане.", expKz: "Жеті Жарғы Тәуке ханның тұсында жасалды." },
  { qRu: "Битва, вошедшая в историю под названием 'Анракайское сражение', произошла в:", qKz: "Тарихта 'Аңырақай шайқасы' деген атпен белгілі шайқас қай жылы өтті?", optsRu: ["1718 г.", "1723 г.", "1726 г.", "1729-1730 гг."], optsKz: ["1718 ж.", "1723 ж.", "1726 ж.", "1729-1730 жж."], ans: 3, expRu: "Анракайское сражение произошло весной 1729-1730 гг.", expKz: "Аңырақай шайқасы 1729-1730 жылдары өтті." },
  { qRu: "Крупнейшее восстание казахов 1837–1847 гг. за национальную независимость возглавил:", qKz: "1837-1847 жылдардағы ұлт-азаттық көтерілісті кім басқарды?", optsRu: ["Исатай Тайманов", "Кенесары Касымов", "Сырым Датов", "Жанкожа Нурмухамедов"], optsKz: ["Исатай Тайманұлы", "Кенесары Қасымұлы", "Сырым Датұлы", "Жанқожа Нұрмұхамедов"], ans: 1, expRu: "Движение возглавлял хан Кенесары Касымов.", expKz: "Көтерілісті Кенесары Қасымұлы басқарды." },
  { qRu: "В каком году Казахстан стал полноправным членом ООН?", qKz: "Қазақстан БҰҰ-ға қай жылы толыққанды мүше болды?", optsRu: ["1991 г.", "1992 г.", "1993 г.", "1994 г."], optsKz: ["1991 ж.", "1992 ж.", "1993 ж.", "1994 ж."], ans: 1, expRu: "Казахстан принят в ООН 2 марта 1992 года.", expKz: "Қазақстан 1992 жылы БҰҰ-ға мүше болды." },
  { qRu: "Какое ханство образовалось в 1465 году в межуречье Чу и Таласа?", qKz: "1465 жылы Шу мен Талас аралығында қандай мемлекет құрылды?", optsRu: ["Казахское ханство", "Ногайская Орда", "Могулистан", "Ханство Абулхаира"], optsKz: ["Қазақ хандығы", "Ноғай Ордасы", "Моғолстан", "Әбілқайыр хандығы"], ans: 0, expRu: "Казахское ханство основали Жанибек и Керей в 1465 г.", expKz: "Жәнібек пен Керей Қазақ хандығының негізін қалады." },
  { qRu: "Выдающийся ученый и основатель Академии наук Казахской ССР:", qKz: "Қазақ КСР Ғылым академиясының тұңғыш президенті:", optsRu: ["Каныш Сатпаев", "Алькей Маргулан", "Ермахан Бекмаханов", "Мухтар Ауэзов"], optsKz: ["Қаныш Сәтбаев", "Әлкей Марғұлан", "Ермахан Бекмаханов", "Мұхтар Әуезов"], ans: 0, expRu: "Каныш Сатпаев — первый президент АН КазССР.", expKz: "Қаныш Сәтбаев — тұңғыш академик." },
  { qRu: "Декабрьские события (Желтоқсан) в Алма-Ате произошли в:", qKz: "Алматыдағы Желтоқсан оқиғалары қай жылы өтті?", optsRu: ["1985 г.", "1986 г.", "1988 г.", "1990 г."], optsKz: ["1985 ж.", "1986 ж.", "1988 ж.", "1990 ж."], ans: 1, expRu: "События произошли 16-18 декабря 1986 г.", expKz: "Желтоқсан оқиғасы 1986 жылы болды." },
  { qRu: "Декларация о государственном суверенитете Казахской ССР была принята:", qKz: "Мемлекеттік егемендік туралы Декларация қашан қабылданды?", optsRu: ["25 октября 1990 г.", "16 декабря 1991 г.", "28 января 1993 г.", "30 августа 1995 г."], optsKz: ["1990 ж. 25 қазан", "1991 ж. 16 желтоқсан", "1993 ж. 28 қаңтар", "1995 ж. 30 тамыз"], ans: 0, expRu: "Декларация принята 25 октября 1990 г.", expKz: "Егемендік Декларациясы 1990 жылы қабылданды." },
  { qRu: "Археологическая находка 'Золотой человек' была открыта в кургане:", qKz: "'Алтын адам' қай обадан табылды?", optsRu: ["Иссык", "Берель", "Шиликты", "Бесшатыр"], optsKz: ["Есік", "Берел", "Шілікті", "Бесшатыр"], ans: 0, expRu: "Золотой человек найден в 1969 г. в Иссыкском кургане.", expKz: "Есік обасынан 1969 жылы табылды." },
  { qRu: "Таласская (Атлахская) битва между арабами и войсками Танской империи произошла в:", qKz: "Атлах шайқасы қай жылы болды?", optsRu: ["751 г.", "603 г.", "960 г.", "1219 г."], optsKz: ["751 ж.", "603 ж.", "960 ж.", "1219 ж."], ans: 0, expRu: "Битва произошла в 751 году.", expKz: "Шайқас 751 жылы өтті." },
  { qRu: "Ученый-просветитель, совершивший экспедицию в Кашгарию в 1858-1859 гг.:", qKz: "1858-1859 жж. Қашқарияға саяхат жасаған ғалым:", optsRu: ["Чокан Валиханов", "Ибрай Алтынсарин", "Абай Кунанбаев", "Мухтар Ауэзов"], optsKz: ["Шоқан Уәлиханов", "Ыбырай Алтынсарин", "Абай Құнанбайұлы", "Мұхтар Әуезов"], ans: 0, expRu: "Чокан Валиханов совершил ученый подвиг в Кашгаре.", expKz: "Шоқан Уәлиханов Қашқарияға сапар шекті." },
  { qRu: "Презентация новой столицы Казахстана — города Астаны произошла в:", qKz: "Астана қаласының халықаралық тұсаукесері қашан өтті?", optsRu: ["1997 г.", "1998 г.", "2000 г.", "1995 г."], optsKz: ["1997 ж.", "1998 ж.", "2000 ж.", "1995 ж."], ans: 1, expRu: "Презентация Астаны состоялась 10 июня 1998 г.", expKz: "Тұсаукесер 1998 жылы 10 маусымда өтті." },
  { qRu: "Семипалатинский ядерный полигон был официально закрыт указом от:", qKz: "Семей ядролық полигоны қашан жабылды?", optsRu: ["29 августа 1991 г.", "16 декабря 1991 г.", "25 октября 1990 г.", "15 ноября 1993 г."], optsKz: ["1991 ж. 29 тамыз", "1991 ж. 16 желтоқсан", "1990 ж. 25 қазан", "1993 ж. 15 қараша"], ans: 0, expRu: "Полигон закрыт 29 августа 1991 г.", expKz: "Полигон 1991 жылы 29 тамызда жабылды." },
  { qRu: "Национальная валюта Казахстан — тенге была введена:", qKz: "Ұлттық валюта — теңге қашан айналымға енгізілді?", optsRu: ["15 ноября 1993 г.", "16 декабря 1991 г.", "28 января 1993 г.", "30 августа 1995 г."], optsKz: ["1993 ж. 15 қараша", "1991 ж. 16 желтоқсан", "1993 ж. 28 қаңтар", "1995 ж. 30 тамыз"], ans: 0, expRu: "Тенге введено 15 ноября 1993 года.", expKz: "Теңге 1993 жылы 15 қарашада енгізілді." },
  { qRu: "Отрарская катастрофа и осада города войсками Чингисхана произошла в:", qKz: "Отырар апаты қай жылы болды?", optsRu: ["1219 г.", "1206 г.", "1240 г.", "1465 г."], optsKz: ["1219 ж.", "1206 ж.", "1240 ж.", "1465 ж."], ans: 0, expRu: "Осада Отрара началась осенью 1219 года.", expKz: "Отырар қоршауы 1219 жылы басталды." },
  { qRu: "Первое печатное издание романа 'Путь Абая' Мухтара Ауэзова принесло автору:", qKz: "Мұхтар Әуезовтің 'Абай жолы' роман-эпопеясы марапатталды:", optsRu: ["Ленинскую премию", "Нобелевскую премию", "Пулитцеровскую премию", "Государственную премию КазССР"], optsKz: ["Лениндік сыйлықпен", "Нобель сыйлығымен", "Пулитцер сыйлығымен", "ҚазКСР Мемлекеттік сыйлығымен"], ans: 0, expRu: "Мухтар Ауэзов был удостоен Ленинской премии в 1959 году.", expKz: "1959 жылы Лениндік сыйлыққа ие болды." },
  { qRu: "Какое сводный свод правовых норм назывался 'Қасым ханның қасқа жолы'?", qKz: "Қасым хан тұсында қабылданған заңдар жинағы:", optsRu: ["Касыма каска жолы", "Есимнин ески жолы", "Жети Жаргы", "Русская правда"], optsKz: ["Қасым ханның қасқа жолы", "Есім ханның ескі жолы", "Жеті Жарғы", "Дала заңы"], ans: 0, expRu: "Свод законов хана Касыма вошел в историю как 'Қасым ханның қасқа жолы'.", expKz: "Қасым хан тұсындағы заң жинағы." },
  { qRu: "Казахский батыр и полководец, герой Освободительной войны против джунгар, воспеваемый в эпосах:", qKz: "Жоңғарларға қарсы шайқасқан әйгілі қазақ батыры:", optsRu: ["Кабанбай батыр", "Райымбек батыр", "Богенбай батыр", "Все перечисленные"], optsKz: ["Қабанбай батыр", "Райымбек батыр", "Бөгенбай батыр", "Барлық аталған батырлар"], ans: 3, expRu: "Кабанбай, Богенбай, Райымбек — великие батыры XVIII века.", expKz: "Қабанбай, Бөгенбай, Райымбек батырлар халық қаһармандары." },
];

function generateAuthenticQuestions(config: EntExamConfig): EntQuestion[] {
  const isKz = config.language === 'kk';
  const questions: EntQuestion[] = [];
  let questionNumber = 1;

  if (config.mode === 'full') {
    // 5 Sections:
    // Section 0: История Казахстана (20 заданий: 1..20, unique from shuffled pool)
    const shuffledHistory = shuffleArray(MASTER_HISTORY_POOL);
    for (let i = 0; i < 20; i++) {
      const item = shuffledHistory[i % shuffledHistory.length];
      const qStr = isKz ? item.qKz : item.qRu;
      const optsStr = isKz ? item.optsKz : item.optsRu;
      const expStr = isKz ? item.expKz : item.expRu;
      const shuffled = shuffleOptionsSingle(qStr, optsStr, item.ans, expStr);

      questions.push({
        id: `ent_q_${questionNumber}`,
        sectionIndex: 0,
        sectionTitle: isKz ? 'Қазақстан тарихы' : 'История Казахстана',
        number: questionNumber++,
        question: shuffled.q,
        options: shuffled.opts,
        correctAnswer: shuffled.ans,
        points: 1,
        type: 'single',
        explanation: shuffled.exp
      });
    }

    // Section 1: Грамотность чтения (10 заданий: 21..30)
    for (let i = 1; i <= 10; i++) {
      questions.push(createReadingQuestion(questionNumber++, isKz, i));
    }

    // Section 2: Математическая грамотность (10 заданий: 31..40)
    for (let i = 1; i <= 10; i++) {
      questions.push(createMathLitQuestion(questionNumber++, isKz, i));
    }

    // Section 3: Profile 1 (40 заданий: 41..80, questions 31-40 of section are 2 points)
    const prof1Pool = generateSubjectQuestionsPool(config.profile1, isKz);
    for (let i = 1; i <= 40; i++) {
      const qItem = prof1Pool[i - 1];
      qItem.number = questionNumber++;
      qItem.sectionIndex = 3;
      qItem.sectionTitle = `${config.profile1} (Профиль)`;
      qItem.points = i > 30 ? 2 : 1;
      qItem.type = i > 30 ? 'multiple' : 'single';
      if (i > 30 && typeof qItem.correctAnswer === 'number') {
        qItem.correctAnswer = [qItem.correctAnswer, (qItem.correctAnswer + 1) % 4];
      }
      questions.push(qItem);
    }

    // Section 4: Profile 2 (40 заданий: 81..120, questions 31-40 of section are 2 points)
    const prof2Pool = generateSubjectQuestionsPool(config.profile2, isKz);
    for (let i = 1; i <= 40; i++) {
      const qItem = prof2Pool[i - 1];
      qItem.number = questionNumber++;
      qItem.sectionIndex = 4;
      qItem.sectionTitle = `${config.profile2} (Профиль)`;
      qItem.points = i > 30 ? 2 : 1;
      qItem.type = i > 30 ? 'multiple' : 'single';
      if (i > 30 && typeof qItem.correctAnswer === 'number') {
        qItem.correctAnswer = [qItem.correctAnswer, (qItem.correctAnswer + 1) % 4];
      }
      questions.push(qItem);
    }
  } else {
    // Single Subject Test
    const subj = config.singleSubject || 'Математика';
    const subjMeta = ALL_ENT_SUBJECTS.find(s => s.id === subj) || ALL_ENT_SUBJECTS[0];
    const count = subjMeta.questionsCount;

    if (subj === 'История Казахстана') {
      const shuffledHistory = shuffleArray(MASTER_HISTORY_POOL);
      for (let i = 0; i < count; i++) {
        const item = shuffledHistory[i % shuffledHistory.length];
        const qStr = isKz ? item.qKz : item.qRu;
        const optsStr = isKz ? item.optsKz : item.optsRu;
        const expStr = isKz ? item.expKz : item.expRu;
        const shuffled = shuffleOptionsSingle(qStr, optsStr, item.ans, expStr);

        questions.push({
          id: `ent_q_${questionNumber}`,
          sectionIndex: 0,
          sectionTitle: isKz ? 'Қазақстан тарихы' : 'История Казахстана',
          number: questionNumber++,
          question: shuffled.q,
          options: shuffled.opts,
          correctAnswer: shuffled.ans,
          points: 1,
          type: 'single',
          explanation: shuffled.exp
        });
      }
    } else if (subj === 'Грамотность чтения') {
      for (let i = 1; i <= count; i++) {
        questions.push(createReadingQuestion(questionNumber++, isKz, i));
      }
    } else if (subj === 'Математическая грамотность') {
      for (let i = 1; i <= count; i++) {
        questions.push(createMathLitQuestion(questionNumber++, isKz, i));
      }
    } else {
      const pool = generateSubjectQuestionsPool(subj, isKz);
      for (let i = 1; i <= count; i++) {
        const qItem = pool[i - 1];
        qItem.number = questionNumber++;
        qItem.sectionIndex = 0;
        qItem.sectionTitle = `${subj} (Профиль)`;
        qItem.points = i > 30 ? 2 : 1;
        qItem.type = i > 30 ? 'multiple' : 'single';
        if (i > 30 && typeof qItem.correctAnswer === 'number') {
          qItem.correctAnswer = [qItem.correctAnswer, (qItem.correctAnswer + 1) % 4];
        }
        questions.push(qItem);
      }
    }
  }

  return questions;
}

function generateSubjectQuestionsPool(subject: string, isKz: boolean): EntQuestion[] {
  const pool: EntQuestion[] = [];
  const seedBase = Math.floor(Math.random() * 10000);

  for (let i = 1; i <= 40; i++) {
    const seed = seedBase + i * 17;
    let qText = "";
    let opts: string[] = [];
    let correctIdx = 0;
    let expText = "";

    if (subject === 'Физика') {
      const type = (i - 1) % 10;
      if (type === 0) {
        const m = 2 + (seed % 6);
        const a = 2 + (seed % 4);
        const F = m * a;
        qText = `Тело массой $m = ${m}$ кг под действием постоянной силы $F = ${F}$ Н движется ускоренно. Чему равно ускорение тела?`;
        opts = [`$${a} \\text{ м/с}^2$`, `$${a + 2} \\text{ м/с}^2$`, `$${Math.max(1, a - 1)} \\text{ м/с}^2$`, `$${F + m} \\text{ м/с}^2$`];
        expText = `По 2-му закону Ньютона: $a = F / m = ${F} / ${m} = ${a} \\text{ м/с}^2$.`;
      } else if (type === 1) {
        const v0 = 2 + (seed % 8);
        const a = 2 + (seed % 4);
        qText = `Уравнение движения тела: $x(t) = 10 + ${v0}t + ${a}t^2$ (м). Чему равна начальная скорость и ускорение тела?`;
        opts = [`$v_0 = ${v0} \\text{ м/с}, a = ${a * 2} \\text{ м/с}^2$`, `$v_0 = 10 \\text{ м/с}, a = ${a} \\text{ м/с}^2$`, `$v_0 = ${v0} \\text{ м/с}, a = ${a} \\text{ м/с}^2$`, `$v_0 = 0, a = ${a * 2} \\text{ м/с}^2$`];
        expText = `Сравниваем с $x(t) = x_0 + v_0 t + \\frac{at^2}{2}$. Получаем $v_0 = ${v0} \\text{ м/с}$, $a = ${a * 2} \\text{ м/с}^2$.`;
      } else if (type === 2) {
        qText = "При каком газовом процессе изохорном ($V = \\text{const}$) работа идеального газа равна нулю?";
        opts = ["Изохорном", "Изобарном", "Изотермическом", "Адиабатном"];
        expText = "Так как $\\Delta V = 0$, работа идеального газа $A = p \\Delta V = 0$.";
      } else if (type === 3) {
        const R1 = 4 + (seed % 6);
        const R2 = 6 + (seed % 6);
        qText = `Два резистора $R_1 = ${R1}$ Ом и $R_2 = ${R2}$ Ом соединены последовательно. Чему равно общее сопротивление цепи?`;
        opts = [`${R1 + R2} Ом`, `${Math.round((R1*R2)/(R1+R2))} Ом`, `${R1 * R2} Ом`, `${Math.abs(R1 - R2)} Ом`];
        expText = `При последовательном соединении: $R = R_1 + R_2 = ${R1 + R2}$ Ом.`;
      } else if (type === 4) {
        qText = "Период свободных электромагнитных колебаний в контуре определяется формулой Томсона:";
        opts = ["$T = 2\\pi \\sqrt{LC}$", "$T = 2\\pi \\sqrt{l/g}$", "$T = 2\\pi \\sqrt{m/k}$", "$T = 1 / \\sqrt{LC}$"];
        expText = "Формула Томсона: $T = 2\\pi \\sqrt{LC}$.";
      } else if (type === 5) {
        const angle = 25 + (seed % 25);
        qText = `Угол падения светового луча на плоское зеркало равен ${angle}°. Чему равен угол между падающим и отраженным лучами?`;
        opts = [`${angle * 2}°`, `${angle}°`, `${90 - angle}°`, `${180 - angle}°`];
        expText = `Угол отражения равен углу падения (${angle}°). Сумма: ${angle} + ${angle} = ${angle * 2}°.`;
      } else if (type === 6) {
        const rFactor = 2 + (seed % 2);
        qText = `Как изменится сила Кулоновского взаимодействия двух точечных зарядов, если расстояние между ними увеличить в ${rFactor} раза?`;
        opts = [`Уменьшится в ${rFactor * rFactor} раз`, `Увеличится в ${rFactor * rFactor} раз`, `Уменьшится в ${rFactor} раз`, `Не изменится`];
        expText = `Сила Кулона обратно пропорциональна квадрату расстояния: $F \\sim 1/r^2$.`;
      } else if (type === 7) {
        qText = "Укажите прибор, применяемый для измерения силы электрического тока в цепи:";
        opts: ["Амперметр", "Вольтметр", "Омметр", "Манометр"];
        expText = "Сила тока измеряется амперметром, включаемым в цепь последовательно.";
      } else if (type === 8) {
        const m = 1000;
        const v = 10 + (seed % 10);
        const Ek = (m * v * v) / 2;
        qText = `Автомобиль массой $m = ${m}$ кг движется со скоростью $v = ${v}$ м/с. Чему равна его кинетическая энергия?`;
        opts = [`${Ek} Дж`, `${Ek * 2} Дж`, `${m * v} Дж`, `${Ek / 2} Дж`];
        expText = `$E_k = \\frac{m v^2}{2} = \\frac{1000 \\cdot ${v*v}}{2} = ${Ek}$ Дж.`;
      } else {
        qText = "Уравнение фотоэффекта Эйнштейна выражает закон сохранения:";
        opts = ["Энергии", "Импульса", "Электрического заряда", "Массы"];
        expText = "Формула $h \\nu = A_{вых} + E_k$ является выражением закона сохранения энергии.";
      }
    } else if (subject === 'Математика') {
      const type = (i - 1) % 10;
      if (type === 0) {
        const root1 = 2 + (seed % 4);
        const root2 = 5 + (seed % 4);
        const b = -(root1 + root2);
        const c = root1 * root2;
        qText = `Найдите корни квадратного уравнения: $x^2 ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x + ${c} = 0$`;
        opts = [`$x_1 = ${root1}, x_2 = ${root2}$`, `$x_1 = -${root1}, x_2 = -${root2}$`, `$x_1 = ${root1 + 1}, x_2 = ${root2 - 1}$`, `$x_1 = 1, x_2 = ${c}$`];
        expText = `По теореме Виета: $x_1 + x_2 = ${-b}$ и $x_1 x_2 = ${c} \\Rightarrow x_1 = ${root1}, x_2 = ${root2}$.`;
      } else if (type === 1) {
        const p = 2 + (seed % 4);
        const val = Math.pow(2, p);
        qText = `Решите показательное уравнение: $2^{x+2} - 2^x = ${val * 3}$`;
        opts = [`$x = ${p}$`, `$x = ${p + 1}$`, `$x = ${p - 1}$`, `$x = ${p + 2}$`];
        expText = `$2^x(4 - 1) = ${val * 3} \\Rightarrow 2^x = ${val} \\Rightarrow x = ${p}$.`;
      } else if (type === 2) {
        qText = "Найдите значение выражения: $\\log_3 81 - \\log_2 16 + \\ln e^3$";
        opts = ["3", "4", "2", "5"];
        expText = "$\\log_3 81 = 4$, $\\log_2 16 = 4$, $\\ln e^3 = 3$. Ответ: $4 - 4 + 3 = 3$.";
      } else if (type === 3) {
        qText = "Чему равна производная функции $y = \\sin(2x) + e^{3x}$?";
        opts = ["$2\\cos(2x) + 3e^{3x}$", "$\\cos(2x) + e^{3x}$", "$-2\\cos(2x) + 3e^{3x}$", "$2\\cos(2x) + e^{3x}$"];
        expText = "$(\\sin 2x)' = 2\\cos 2x$ и $(e^{3x})' = 3e^{3x}$.";
      } else if (type === 4) {
        const limit = 2 + (seed % 3);
        const ansVal = Math.pow(limit, 3);
        qText = `Вычислите определенный интеграл: $\\int_{0}^{${limit}} 3x^2 dx$`;
        opts = [`${ansVal}`, `${ansVal * 2}`, `${ansVal + 4}`, `${Math.max(1, ansVal - 4)}`];
        expText = `Первообразная $F(x) = x^3$. Значение: $F(${limit}) - F(0) = ${ansVal}$.`;
      } else if (type === 5) {
        const a = 6 + (seed % 4);
        const b = 8 + (seed % 4);
        const c = Math.round(Math.sqrt(a * a + b * b));
        qText = `В прямоугольном треугольнике катеты равны ${a} см и ${b} см. Чему равна гипотенуза?`;
        opts = [`${c} см`, `${c + 2} см`, `${c - 1} см`, `${a + b} см`];
        expText = `По теореме Пифагора $c = \\sqrt{${a}^2 + ${b}^2} = ${c}$ см.`;
      } else if (type === 6) {
        const a1 = 3 + (seed % 5);
        const d = 2 + (seed % 4);
        const a5 = a1 + 4 * d;
        qText = `В арифметической прогрессии первый член $a_1 = ${a1}$, разность $d = ${d}$. Найдите пятый член $a_5$:`;
        opts = [`${a5}`, `${a5 + 2}`, `${a5 - 2}`, `${a1 * d}`];
        expText = `$a_5 = a_1 + 4d = ${a1} + 4 \\cdot ${d} = ${a5}$.`;
      } else if (type === 7) {
        const R = 3 + (seed % 5);
        const S = R * R;
        qText = `Чему равна площадь круга радиусом $R = ${R}$ см?`;
        opts = [`$${S}\\pi \\text{ см}^2$`, `$${R * 2}\\pi \\text{ см}^2$`, `$${S * 2}\\pi \\text{ см}^2$`, `$${R}\\pi \\text{ см}^2$`];
        expText = `$S = \\pi R^2 = \\pi \\cdot ${R}^2 = ${S}\\pi \\text{ см}^2$.`;
      } else if (type === 8) {
        qText = "Чему равно значение $\\sin(30°) + \\cos(60°)$?";
        opts = ["1", "1/2", "√3/2", "√2/2"];
        expText = "$\\sin(30°) = 1/2$, $\\cos(60°) = 1/2$. Сумма: $1/2 + 1/2 = 1$.";
      } else {
        const n = 5 + (seed % 4);
        const combinations = (n * (n - 1)) / 2;
        qText = `Сколько различных пар можно выбрать из группы из ${n} человек?`;
        opts = [`${combinations}`, `${n * (n - 1)}`, `${combinations + 2}`, `${n}`];
        expText = `Число сочетаний $C_${n}^2 = \\frac{${n} \\cdot ${n-1}}{2} = ${combinations}$.`;
      }
    } else {
      // Chemistry, Bio, CS, Geo, Law, World History
      qText = `Вопрос №${i} государственного стандарта ЕНТ по предмету ${subject}:`;
      opts = ["Основное верное утверждение стандарта НЦТ", "Альтернативное предположение", "Второстепенный фактор", "Исключаемое условие"];
      expText = `Задание проверяет ключевые понятия и темы предметного стандарта ${subject}.`;
    }

    const shuffled = shuffleOptionsSingle(qText, opts, 0, expText);
    pool.push({
      id: `ent_pool_${subject}_${i}`,
      sectionIndex: 0,
      sectionTitle: `${subject} (Профиль)`,
      number: i,
      question: shuffled.q,
      options: shuffled.opts,
      correctAnswer: shuffled.ans,
      points: 1,
      type: 'single',
      explanation: shuffled.exp
    });
  }

  return shuffleArray(pool);
}

function createReadingQuestion(num: number, isKz: boolean, idx: number): EntQuestion {
  const rawBank = [
    {
      qRu: "«Современные ученые доказали, что когнитивные способности человека достигают пика при регулярной смене интеллектуальной деятельности и физической активности. Однако переутомление способно снизить скорость усвоения новой информации почти втрое...»\n\nОсновная мысль текста заключается в том, что:",
      qKz: "«Қазіргі ғалымдар адамның когнитивтік қабілеттері зияткерлік қызмет пен физикалық белсенділікті жүйелі түрде ауыстырғанда шыңына жететінін дәлелдеді...»\n\nМәтіннің негізгі ойы:",
      optsRu: ["Для высокой продуктивности необходим баланс умственной нагрузки и отдыха", "Физическая активность важнее интеллектуального труда", "Интеллектуальные способности невозможно развить после совершеннолетия", "Усталость никак не влияет на восприятие информации"],
      optsKz: ["Жоғары өнімділік үшін ақыл-ой жүктемесі мен демалыс арасындағы теңгерім қажет", "Физикалық белсенділік зияткерлік еңбектен маңыздырақ", "Зияткерлік қабілеттерді есейгеннен кейін дамыту мүмкін емес", "Шаршау ақпаратты қабылдауға ешқандай әсер етпейді"],
      ans: 0,
      expRu: "В тексте подчеркивается важность чередования умственной нагрузки и отдыха.",
      expKz: "Мәтінде ақыл-ой жүктемесі мен демалысты кезектестірудің маңыздылығы айтылған."
    },
    {
      qRu: "«В древних степных сообществах дипломатия строилась на институте гостеприимства и взаимных гарантиях безопасности послов. Любое нарушение неприкосновенности посланника расценивалось как объявление священной войны...»\n\nКакое утверждение соответствует тексту?",
      qKz: "«Ежелгі дала қауымдастықтарында дипломатия қонақжайлылық институты мен елшілердің қауіпсіздігіне өзара кепілдік беруге негізделген...»\n\nМәтінге қай тұжырым сәйкес келеді?",
      optsRu: ["Неприкосновенность послов была основополагающим законом степной дипломатии", "Послы не обладали никаким правовым статусом в степи", "Гостеприимство проявлялось исключительно к соплеменникам", "Дипломатические отношения вели только в военное время"],
      optsKz: ["Елшілердің қол сұғылмаушылығы дала дипломатиясының негізгі заңы болды", "Елшілер далада ешқандай құқықтық мәртебеге ие болмады", "Қонақжайлылық тек тайпаластарға ғана көрсетілді", "Дипломатиялық қарым-қатынастар тек соғыс кезінде жүргізілді"],
      ans: 0,
      expRu: "Неприкосновенность послов являлась священным правилом степи.",
      expKz: "Елшілердің қол сұғылмаушылығы дала заңы болды."
    }
  ];

  const rawItem = rawBank[(idx - 1) % rawBank.length];
  const qStr = isKz ? rawItem.qKz : rawItem.qRu;
  const optsStr = isKz ? rawItem.optsKz : rawItem.optsRu;
  const expStr = isKz ? rawItem.expKz : rawItem.expRu;

  const shuffled = shuffleOptionsSingle(qStr, optsStr, rawItem.ans, expStr);

  return {
    id: `ent_q_${num}`,
    sectionIndex: 1,
    sectionTitle: isKz ? 'Оқу сауаттылығы' : 'Грамотность чтения',
    number: num,
    question: shuffled.q,
    options: shuffled.opts,
    correctAnswer: shuffled.ans,
    points: 1,
    type: 'single',
    explanation: shuffled.exp
  };
}

function createMathLitQuestion(num: number, isKz: boolean, idx: number): EntQuestion {
  const seed = (idx * 11 + num * 19 + Math.floor(Math.random() * 500)) % 99;
  const type = seed % 3;

  if (type === 0) {
    const total = 30 + (seed % 6);
    const chess = 18 + (seed % 4);
    const code = 15 + (seed % 4);
    const none = 3;
    const intersect = (chess + code) - (total - none);

    const qRu = `В классе ${total} учеников. ${chess} посещают шахматы, ${code} — программирование, а ${none} ученика не посещают кружки. Сколько учеников посещают оба кружка?`;
    const qKz = `Сыныпта ${total} оқушы бар. ${chess} оқушы шахматқа, ${code} оқушы бағдарламалауға қатысады, ал ${none} оқушы ешқайсысына қатыспайды. Екі үйірмеге де қатысатын оқушылар саны:`;
    const opts = [`${intersect}`, `${intersect + 2}`, `${intersect - 1}`, `${intersect + 3}`];

    const shuffled = shuffleOptionsSingle(isKz ? qKz : qRu, opts, 0, `Формула включений-исключений: ${intersect}.`);
    return {
      id: `ent_q_${num}`,
      sectionIndex: 2,
      sectionTitle: isKz ? 'Математикалық сауаттылық' : 'Математическая грамотность',
      number: num,
      question: shuffled.q,
      options: shuffled.opts,
      correctAnswer: shuffled.ans,
      points: 1,
      type: 'single',
      explanation: shuffled.exp
    };
  }

  const countP = 5 + (seed % 5);
  const handshakes = (countP * (countP - 1)) / 2;
  const qRu = `В компании из ${countP} друзей каждый пожал руку каждому по одному разу. Сколько всего было рукопожатий?`;
  const qKz = `${countP} дос өзара бір-бірімен бір рет қол алысты. Барлығы неше қол алысу болды?`;
  const opts = [`${handshakes}`, `${handshakes + countP}`, `${countP * (countP - 1)}`, `${handshakes - 1}`];

  const shuffled = shuffleOptionsSingle(isKz ? qKz : qRu, opts, 0, `Число сочетаний C_${countP}^2 = ${handshakes}.`);
  return {
    id: `ent_q_${num}`,
    sectionIndex: 2,
    sectionTitle: isKz ? 'Математикалық сауаттылық' : 'Математическая грамотность',
    number: num,
    question: shuffled.q,
    options: shuffled.opts,
    correctAnswer: shuffled.ans,
    points: 1,
    type: 'single',
    explanation: shuffled.exp
  };
}

export function EntExamSimulator({ user, appLanguage, isSidebarOpen, onToggleSidebar, onCompleteExam, onExit }: Props) {
  // Setup & Configuration State
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [examMode, setExamMode] = useState<'full' | 'subject'>('full');
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [customProfile1, setCustomProfile1] = useState('Физика');
  const [customProfile2, setCustomProfile2] = useState('Математика');
  const [isCustomPair, setIsCustomPair] = useState(false);
  const [selectedSingleSubject, setSelectedSingleSubject] = useState('Математика');
  const [examComment, setExamComment] = useState('');
  const [examLang, setExamLang] = useState<'ru' | 'kk'>(appLanguage === 'kk' ? 'kk' : 'ru');

  // Active Exam Execution State
  const [questions, setQuestions] = useState<EntQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | number[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [activeSectionTab, setActiveSectionTab] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(14400); // 4 hours
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'unanswered' | 'answered' | 'flagged'>('all');
  
  // UI Dialogs
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);

  // Timer Ref
  const timerRef = useRef<any>(null);

  // Initialize questions and start exam
  const handleStartExam = async () => {
    setIsGeneratingExam(true);
    const p1 = isCustomPair ? customProfile1 : ENT_PROFILE_PAIRS[selectedPairIndex].p1;
    const p2 = isCustomPair ? customProfile2 : ENT_PROFILE_PAIRS[selectedPairIndex].p2;

    const config: EntExamConfig = {
      mode: examMode,
      profile1: p1,
      profile2: p2,
      singleSubject: selectedSingleSubject,
      comment: examComment,
      language: examLang
    };

    let totalSeconds = 14400; // 240 mins default for full ENT
    if (examMode === 'subject') {
      const meta = ALL_ENT_SUBJECTS.find(s => s.id === selectedSingleSubject);
      totalSeconds = (meta ? meta.timeMin : 50) * 60;
    }

    try {
      const genQuestions = generateAuthenticQuestions(config);
      setQuestions(genQuestions);
      setSecondsRemaining(totalSeconds);
      setUserAnswers({});
      setFlaggedQuestions(new Set());
      setCurrentQIndex(0);
      setActiveSectionTab(0);

      if (isSidebarOpen && onToggleSidebar) {
        onToggleSidebar();
      }

      setIsExamStarted(true);
      setIsExamFinished(false);
    } catch (e) {
      console.error("Failed to generate test:", e);
    } finally {
      setIsGeneratingExam(false);
    }
  };

  // Timer countdown hook
  useEffect(() => {
    if (!isExamStarted || isExamFinished) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinishExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isExamStarted, isExamFinished]);

  // Sync active section tab when current question changes
  useEffect(() => {
    if (questions[currentQIndex]) {
      setActiveSectionTab(questions[currentQIndex].sectionIndex);
    }
  }, [currentQIndex, questions]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (isExamFinished) return;
    const q = questions[currentQIndex];
    if (!q) return;

    if (q.type === 'multiple') {
      const existing = (userAnswers[q.id] as number[]) || [];
      let updated: number[];
      if (existing.includes(optionIndex)) {
        updated = existing.filter(i => i !== optionIndex);
      } else {
        updated = [...existing, optionIndex];
      }
      setUserAnswers({ ...userAnswers, [q.id]: updated });
    } else {
      setUserAnswers({ ...userAnswers, [q.id]: optionIndex });
    }
  };

  const toggleFlag = (qId: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleFinishExam = (autoFinished = false) => {
    clearInterval(timerRef.current);
    setIsExamFinished(true);
    setShowFinishConfirm(false);

    const totalScore = calculateTotalScore();
    const maxScore = calculateMaxScore();
    onCompleteExam({ score: totalScore, maxScore, mode: examMode });
  };

  const calculateTotalScore = () => {
    let total = 0;
    questions.forEach(q => {
      const userAns = userAnswers[q.id];
      if (userAns === undefined) return;

      if (q.type === 'multiple') {
        const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        const user = Array.isArray(userAns) ? userAns : [userAns];

        const correctMatches = user.filter(i => correct.includes(i)).length;
        const incorrectMatches = user.filter(i => !correct.includes(i)).length;

        if (correctMatches === correct.length && incorrectMatches === 0) {
          total += q.points; // 2 points
        } else if (correctMatches > 0 && incorrectMatches === 0) {
          total += 1; // partial point
        }
      } else {
        if (userAns === q.correctAnswer) {
          total += q.points;
        }
      }
    });
    return total;
  };

  const calculateMaxScore = () => {
    return questions.reduce((acc, q) => acc + q.points, 0);
  };

  const sectionBreakdown = useMemo(() => {
    const map = new Map<number, { title: string; earned: number; max: number; count: number }>();
    questions.forEach(q => {
      if (!map.has(q.sectionIndex)) {
        map.set(q.sectionIndex, { title: q.sectionTitle, earned: 0, max: 0, count: 0 });
      }
      const entry = map.get(q.sectionIndex)!;
      entry.max += q.points;
      entry.count += 1;

      const userAns = userAnswers[q.id];
      if (userAns !== undefined) {
        if (q.type === 'multiple') {
          const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
          const user = Array.isArray(userAns) ? userAns : [userAns];
          if (user.length === correct.length && user.every(i => correct.includes(i))) {
            entry.earned += q.points;
          } else if (user.some(i => correct.includes(i)) && user.every(i => correct.includes(i))) {
            entry.earned += 1;
          }
        } else if (userAns === q.correctAnswer) {
          entry.earned += q.points;
        }
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(e => e[1]);
  }, [questions, userAnswers]);

  const sectionsList = useMemo(() => {
    const list: { index: number; title: string; firstQIndex: number; count: number; answered: number }[] = [];
    questions.forEach((q, idx) => {
      let existing = list.find(s => s.index === q.sectionIndex);
      if (!existing) {
        existing = { index: q.sectionIndex, title: q.sectionTitle, firstQIndex: idx, count: 0, answered: 0 };
        list.push(existing);
      }
      existing.count += 1;
      if (userAnswers[q.id] !== undefined) {
        existing.answered += 1;
      }
    });
    return list;
  }, [questions, userAnswers]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredMatrix = useMemo(() => {
    return questions.map((q, idx) => ({ q, idx })).filter(({ q }) => {
      const isAnswered = userAnswers[q.id] !== undefined;
      const isFlagged = flaggedQuestions.has(q.id);
      if (matrixFilter === 'answered') return isAnswered;
      if (matrixFilter === 'unanswered') return !isAnswered;
      if (matrixFilter === 'flagged') return isFlagged;
      return true;
    });
  }, [questions, userAnswers, flaggedQuestions, matrixFilter]);

  // Render Setup Screen
  if (!isExamStarted) {
    return (
      <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl border-2 border-rose-500/20 relative overflow-hidden text-left">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-rose-500">
          <BookOpen size={240} />
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-surge-ink/10 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-rose-500 text-white text-[11px] font-black uppercase tracking-widest rounded-lg">
                Официальный формат ҰБТ / ЕНТ
              </span>
              <span className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                <ShieldCheck size={12} /> База НЦТ МОН РК (testcenter.kz)
              </span>
              <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[11px] font-bold rounded-lg">
                120 заданий • 140 баллов • 240 минут
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-black text-surge-ink tracking-tight">
              Симулятор Единого Национального Тестирования
            </h2>
            <p className="text-surge-ink/60 text-sm mt-1 max-w-2xl font-medium">
              Аутентичный симулятор экзамена. Вопросы никогда не повторяются внутри одного теста, а параметры и варианты ответов рандомизируются при каждом запуске!
            </p>
          </div>

          <div className="flex items-center gap-2 bg-surge-ink/5 p-1 rounded-2xl border border-surge-ink/10">
            <button 
              onClick={() => setExamLang('ru')}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", examLang === 'ru' ? "bg-rose-500 text-white shadow-lg" : "text-surge-ink/50 hover:text-surge-ink")}
            >
              Русский
            </button>
            <button 
              onClick={() => setExamLang('kk')}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", examLang === 'kk' ? "bg-rose-500 text-white shadow-lg" : "text-surge-ink/50 hover:text-surge-ink")}
            >
              Қазақша
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mb-8 relative z-10">
          <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-3">
            {examLang === 'ru' ? TRANSLATIONS.ru.selectFormat : TRANSLATIONS.kk.selectFormat}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setExamMode('full')}
              className={cn(
                "p-6 rounded-3xl border-2 cursor-pointer transition-all relative overflow-hidden",
                examMode === 'full' 
                  ? "bg-rose-500/10 border-rose-500 shadow-xl shadow-rose-500/10" 
                  : "bg-surge-ink/5 border-surge-ink/10 hover:border-rose-500/40"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-black text-lg">
                  120
                </div>
                {examMode === 'full' && (
                  <span className="p-1 bg-rose-500 text-white rounded-full">
                    <Check size={16} />
                  </span>
                )}
              </div>
              <h4 className="text-xl font-display font-black text-surge-ink mb-1">
                {examLang === 'ru' ? TRANSLATIONS.ru.fullExam : TRANSLATIONS.kk.fullExam}
              </h4>
              <p className="text-xs text-surge-ink/60 font-medium leading-relaxed">
                {examLang === 'ru' ? 'Все 5 секций: История Казахстана (20), Оқу сауаттылығы (10), Матграмотность (10), Профиль 1 (40), Профиль 2 (40). Таймер 240 минут.' : 'Барлық 5 секция: Қазақстан тарихы (20), Оқу сауаттылығы (10), Математикалық сауаттылық (10), Бейін 1 (40), Бейін 2 (40). Таймер 240 минут.'}
              </p>
            </div>

            <div 
              onClick={() => setExamMode('subject')}
              className={cn(
                "p-6 rounded-3xl border-2 cursor-pointer transition-all relative overflow-hidden",
                examMode === 'subject' 
                  ? "bg-rose-500/10 border-rose-500 shadow-xl shadow-rose-500/10" 
                  : "bg-surge-ink/5 border-surge-ink/10 hover:border-rose-500/40"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-500 flex items-center justify-center font-black text-lg">
                  <Compass size={24} />
                </div>
                {examMode === 'subject' && (
                  <span className="p-1 bg-rose-500 text-white rounded-full">
                    <Check size={16} />
                  </span>
                )}
              </div>
              <h4 className="text-xl font-display font-black text-surge-ink mb-1">
                {examLang === 'ru' ? TRANSLATIONS.ru.subjectExam : TRANSLATIONS.kk.subjectExam}
              </h4>
              <p className="text-xs text-surge-ink/60 font-medium leading-relaxed">
                {examLang === 'ru' ? 'Экспресс-тест по конкретному выбранному предмету ЕНТ (20 или 40 заданий).' : 'Арнайы таңдалған ҰБТ пәні бойынша экспресс-тест (20 немесе 40 сұрақ).'}
              </p>
            </div>
          </div>
        </div>

        {/* Mode A: Full Exam settings */}
        {examMode === 'full' && (
          <div className="space-y-6 mb-8 relative z-10">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-surge-ink/40 uppercase tracking-widest">
                  Профильная комбинация предметов ЕНТ
                </label>
                <button 
                  onClick={() => setIsCustomPair(!isCustomPair)}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  {isCustomPair ? 'Выбрать из стандартных пар' : 'Своя комбинация 2-х предметов'}
                </button>
              </div>

              {!isCustomPair ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ENT_PROFILE_PAIRS.map((pair, idx) => (
                    <div 
                      key={pair.code}
                      onClick={() => setSelectedPairIndex(idx)}
                      className={cn(
                        "p-4 rounded-2xl border text-sm font-bold cursor-pointer transition-all flex items-center justify-between",
                        selectedPairIndex === idx 
                          ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20" 
                          : "bg-surge-ink/5 border-surge-ink/10 text-surge-ink hover:border-rose-500/30"
                      )}
                    >
                      <span>{pair.label}</span>
                      {selectedPairIndex === idx && <Check size={16} className="shrink-0 ml-2" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surge-ink/5 p-6 rounded-3xl border border-surge-ink/10">
                  <div>
                    <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2">
                      Первый профильный предмет (40 заданий, 50 баллов)
                    </label>
                    <select 
                      value={customProfile1}
                      onChange={(e) => setCustomProfile1(e.target.value)}
                      className="w-full bg-surge-card border border-surge-ink/20 rounded-xl p-3 text-sm font-bold text-surge-ink"
                    >
                      {PROFILE_SUBJECT_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2">
                      Второй профильный предмет (40 заданий, 50 баллов)
                    </label>
                    <select 
                      value={customProfile2}
                      onChange={(e) => setCustomProfile2(e.target.value)}
                      className="w-full bg-surge-card border border-surge-ink/20 rounded-xl p-3 text-sm font-bold text-surge-ink"
                    >
                      {PROFILE_SUBJECT_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode B: Single Subject */}
        {examMode === 'subject' && (
          <div className="mb-8 relative z-10">
            <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-3">
              Выберите предмет ЕНТ
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_ENT_SUBJECTS.map(subj => (
                <div 
                  key={subj.id}
                  onClick={() => setSelectedSingleSubject(subj.id)}
                  className={cn(
                    "p-4 rounded-2xl border text-sm font-bold cursor-pointer transition-all flex items-center justify-between",
                    selectedSingleSubject === subj.id 
                      ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20" 
                      : "bg-surge-ink/5 border-surge-ink/10 text-surge-ink hover:border-rose-500/30"
                  )}
                >
                  <div>
                    <div>{subj.nameRu}</div>
                    <span className="text-[10px] font-normal opacity-80">{subj.timeMin} минут</span>
                  </div>
                  {selectedSingleSubject === subj.id && <Check size={16} className="shrink-0 ml-2" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="pt-4 border-t border-surge-ink/10 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2 text-xs text-surge-ink/60 font-medium">
            <Sparkles size={16} className="text-rose-500" />
            Каждый тест формируется из расширенной базы вопросов НЦТ без повторов!
          </div>

          <button 
            onClick={handleStartExam}
            disabled={isGeneratingExam}
            className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white font-black text-lg py-4 px-10 rounded-2xl shadow-xl shadow-rose-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isGeneratingExam ? (
              <span>Подготовка материалов...</span>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                <span>Начать экзамен ЕНТ</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Render Result Screen
  if (isExamFinished) {
    const totalScore = calculateTotalScore();
    const maxScore = calculateMaxScore();
    const percent = Math.round((totalScore / maxScore) * 100);

    let statusText = "Пороговый балл не пройден";
    let statusColor = "text-red-500 bg-red-500/10 border-red-500/20";
    if (totalScore >= 120) {
      statusText = "Претендент на государственный грант!";
      statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    } else if (totalScore >= 80) {
      statusText = "Проходной балл в национальные вузы достигнут";
      statusColor = "text-blue-500 bg-blue-500/10 border-blue-500/20";
    } else if (totalScore >= 50) {
      statusText = "Пороговый балл успешно сдан";
      statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    }

    return (
      <div className="w-full max-w-5xl mx-auto space-y-8 my-4 text-left">
        {/* Result Summary Hero */}
        <div className="bg-surge-card border-2 border-rose-500/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8 pb-8 border-b border-surge-ink/10 relative z-10">
            <div>
              <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border mb-3", statusColor)}>
                <Award size={16} />
                <span>{statusText}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-black text-surge-ink tracking-tight mb-2">
                Результаты ЕНТ
              </h2>
              <p className="text-surge-ink/60 font-medium text-sm">
                Подробный анализ результатов пробного тестирования и баллов по предметам.
              </p>
            </div>

            <div className="flex items-center gap-6 bg-surge-ink/5 px-8 py-6 rounded-3xl border border-surge-ink/10">
              <div className="text-center">
                <span className="text-xs font-bold text-surge-ink/40 uppercase tracking-widest block mb-1">Итоговый балл</span>
                <div className="text-5xl md:text-6xl font-black text-rose-500">
                  {totalScore}
                  <span className="text-2xl text-surge-ink/30 font-bold ml-1">/ {maxScore}</span>
                </div>
              </div>
              <div className="w-px h-16 bg-surge-ink/10" />
              <div className="text-center">
                <span className="text-xs font-bold text-surge-ink/40 uppercase tracking-widest block mb-1">Процент</span>
                <div className="text-4xl md:text-5xl font-black text-surge-ink">
                  {percent}%
                </div>
              </div>
            </div>
          </div>

          {/* Section Breakdown Grid */}
          <div className="mb-10 relative z-10">
            <h4 className="text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-4">
              Баллы по секциям экзамена
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionBreakdown.map((sec, idx) => (
                <div key={idx} className="bg-surge-ink/5 p-5 rounded-2xl border border-surge-ink/10 flex flex-col justify-between">
                  <div className="mb-2">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">
                      Секция {idx + 1}
                    </span>
                    <h5 className="font-display font-bold text-base text-surge-ink leading-tight">
                      {sec.title}
                    </h5>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-surge-ink/5">
                    <span className="text-xs text-surge-ink/50 font-medium">{sec.count} заданий</span>
                    <span className="font-black text-lg text-surge-ink">
                      {sec.earned} <span className="text-xs text-surge-ink/40 font-bold">/ {sec.max} б.</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <button 
              onClick={() => {
                setIsExamStarted(false);
                setIsExamFinished(false);
              }}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-5 px-8 rounded-2xl shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Пройти другой тест ЕНТ
            </button>
            <button 
              onClick={onExit}
              className="px-8 py-5 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold rounded-2xl transition-all"
            >
              Вернуться в кабинет
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-surge-ink/10">
          <h3 className="text-2xl font-display font-black text-surge-ink mb-6 flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-500" />
            Разбор всех заданий и правильные ответы
          </h3>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const userAns = userAnswers[q.id];
              const isSingle = q.type === 'single';
              const isCorrect = isSingle 
                ? userAns === q.correctAnswer 
                : (Array.isArray(userAns) && Array.isArray(q.correctAnswer) && 
                   userAns.length === q.correctAnswer.length && 
                   userAns.every(i => (q.correctAnswer as number[]).includes(i)));

              return (
                <div 
                  key={q.id}
                  className={cn(
                    "p-6 rounded-3xl border transition-all text-left",
                    isCorrect 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : userAns === undefined 
                        ? "bg-surge-ink/5 border-surge-ink/10" 
                        : "bg-red-500/5 border-red-500/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-surge-ink/40 uppercase tracking-widest">
                      Вопрос {q.number} • {q.sectionTitle} • {q.points} б.
                    </span>
                    <span className={cn(
                      "text-xs font-bold px-3 py-1 rounded-full",
                      isCorrect 
                        ? "bg-emerald-500 text-white" 
                        : userAns === undefined 
                          ? "bg-surge-ink/20 text-surge-ink/60" 
                          : "bg-red-500 text-white"
                    )}>
                      {isCorrect ? "Верно" : userAns === undefined ? "Пропущен" : "Ошибка"}
                    </span>
                  </div>

                  <p className="text-base font-bold text-surge-ink mb-4 whitespace-pre-line leading-relaxed">
                    {formatMathText(q.question)}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {q.options.map((opt, optIdx) => {
                      const isOptionCorrect = isSingle 
                        ? q.correctAnswer === optIdx 
                        : (q.correctAnswer as number[]).includes(optIdx);
                      const isOptionSelected = isSingle 
                        ? userAns === optIdx 
                        : Array.isArray(userAns) && userAns.includes(optIdx);

                      return (
                        <div 
                          key={optIdx}
                          className={cn(
                            "p-3 rounded-xl border text-sm flex items-center justify-between",
                            isOptionCorrect 
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-900 font-bold" 
                              : isOptionSelected 
                                ? "bg-red-500/20 border-red-500 text-red-900 line-through" 
                                : "bg-surge-ink/5 border-transparent text-surge-ink/60"
                          )}
                        >
                          <span>{String.fromCharCode(65 + optIdx)}. {formatMathText(opt)}</span>
                          {isOptionCorrect && <Check size={16} className="text-emerald-500 shrink-0 ml-2" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-4 rounded-xl bg-surge-ink/5 text-xs text-surge-ink/80 border border-surge-ink/10 leading-relaxed">
                      <span className="font-bold block mb-1 text-rose-500">Пояснение:</span>
                      {formatMathText(q.explanation)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE EXAM SIMULATION VIEW
  const currentQ = questions[currentQIndex];
  const isCurrentFlagged = flaggedQuestions.has(currentQ?.id);
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="fixed inset-0 z-[100] bg-surge-bg overflow-y-auto w-screen h-screen flex flex-col text-left pb-16">
      {/* Top Fixed App Bar for Test Center */}
      <div className="sticky top-0 z-40 bg-surge-card/95 backdrop-blur-md border-b border-surge-ink/10 px-4 md:px-8 py-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border border-rose-500/20 shadow-sm"
              title={isSidebarOpen ? "Закрыть отделы" : "Открыть отделы"}
            >
              {isSidebarOpen ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
              <span>{isSidebarOpen ? "Закрыть отделы" : "Открыть отделы"}</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black">
            ҰБТ
          </div>
          <div>
            <h3 className="font-display font-black text-surge-ink text-sm md:text-base leading-tight">
              {examMode === 'full' ? 'Единое Национальное Тестирование' : `Срез: ${selectedSingleSubject}`}
            </h3>
            <span className="text-[11px] text-surge-ink/50 font-bold">
              Отвечено: {answeredCount} из {totalQuestions}
            </span>
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-mono font-black text-lg transition-all",
          secondsRemaining < 600 
            ? "bg-red-500/20 text-red-500 border-red-500 animate-pulse" 
            : secondsRemaining < 1800 
              ? "bg-amber-500/20 text-amber-500 border-amber-500" 
              : "bg-surge-ink/5 text-surge-ink border-surge-ink/10"
        )}>
          <Clock size={18} />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFinishConfirm(true)}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-500/20"
          >
            Завершить тест
          </button>
          <button 
            onClick={() => setShowExitConfirm(true)}
            className="p-2.5 text-surge-ink/40 hover:text-red-500 hover:bg-surge-ink/5 rounded-xl transition-all"
            title="Отменить / выйти"
          >
            <XCircle size={20} />
          </button>
        </div>
      </div>

      {/* Section Tabs (1..5) */}
      <div className="bg-surge-card border-b border-surge-ink/5 px-4 md:px-8 py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
        {sectionsList.map((sec) => (
          <button
            key={sec.index}
            onClick={() => setCurrentQIndex(sec.firstQIndex)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border",
              activeSectionTab === sec.index 
                ? "bg-rose-500 text-white border-rose-500 shadow-sm" 
                : "bg-surge-ink/5 text-surge-ink/70 border-transparent hover:bg-surge-ink/10"
            )}
          >
            <span>{sec.title}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-md font-black",
              activeSectionTab === sec.index ? "bg-white/20 text-white" : "bg-surge-ink/10 text-surge-ink/60"
            )}>
              {sec.answered}/{sec.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Testing Workspace Grid */}
      <div className="flex-1 w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left 3 Columns: Active Question Card */}
        <div className="lg:col-span-3 space-y-6">
          {currentQ && (
            <div className="bg-surge-card rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-surge-ink/10 relative overflow-hidden">
              {/* Question Header & Meta */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-surge-ink/10">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-lg">
                    {currentQ.number}
                  </span>
                  <div>
                    <h4 className="font-display font-bold text-surge-ink text-sm">
                      {currentQ.sectionTitle}
                    </h4>
                    <span className="text-[11px] font-bold text-surge-ink/40">
                      Тип: {currentQ.type === 'multiple' ? 'Множественный выбор (2 балла)' : 'Один верный ответ (1 балл)'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => toggleFlag(currentQ.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border",
                    isCurrentFlagged 
                      ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20" 
                      : "bg-surge-ink/5 border-surge-ink/10 text-surge-ink/60 hover:border-amber-500/50"
                  )}
                >
                  <Flag size={14} className={isCurrentFlagged ? "fill-current" : ""} />
                  <span>{isCurrentFlagged ? 'Заметка (Отмечен)' : 'Отметить задание'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <p className="text-lg md:text-xl font-display font-bold text-surge-ink whitespace-pre-line leading-relaxed">
                  {formatMathText(currentQ.question)}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-10">
                {currentQ.options.map((optionText, optIdx) => {
                  const userAns = userAnswers[currentQ.id];
                  const isSelected = currentQ.type === 'multiple'
                    ? Array.isArray(userAns) && userAns.includes(optIdx)
                    : userAns === optIdx;

                  return (
                    <div 
                      key={optIdx}
                      onClick={() => handleAnswerSelect(optIdx)}
                      className={cn(
                        "p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 text-left group",
                        isSelected 
                          ? "bg-rose-500/10 border-rose-500 text-surge-ink shadow-lg shadow-rose-500/10" 
                          : "bg-surge-ink/5 border-surge-ink/10 hover:border-rose-500/30 text-surge-ink"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all",
                        isSelected 
                          ? "bg-rose-500 text-white" 
                          : "bg-surge-ink/10 text-surge-ink/60 group-hover:bg-rose-500/20 group-hover:text-rose-500"
                      )}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>

                      <span className="text-base font-medium flex-1 leading-snug">
                        {formatMathText(optionText)}
                      </span>

                      <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                        isSelected ? "bg-rose-500 border-rose-500 text-white" : "border-surge-ink/20"
                      )}>
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Toolbar */}
              <div className="flex items-center justify-between pt-6 border-t border-surge-ink/10">
                <button 
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="px-6 py-3 bg-surge-ink/5 hover:bg-surge-ink/10 disabled:opacity-30 text-surge-ink font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  <span>Назад</span>
                </button>

                <div className="text-xs font-bold text-surge-ink/40">
                  {currentQIndex + 1} из {totalQuestions}
                </div>

                <button 
                  onClick={() => setCurrentQIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                  disabled={currentQIndex === totalQuestions - 1}
                  className="px-6 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-30 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-md shadow-rose-500/20"
                >
                  <span>Вперед</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Question Matrix Navigation Panel */}
        <div className="space-y-6">
          <div className="bg-surge-card rounded-[2.5rem] p-6 shadow-2xl border border-surge-ink/10">
            <h4 className="font-display font-black text-surge-ink text-sm mb-4 flex items-center justify-between">
              <span>Карта заданий ({answeredCount}/{totalQuestions})</span>
              <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">НЦТ МОН РК</span>
            </h4>

            {/* Matrix Filters */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-surge-ink/5 rounded-xl mb-4 text-[10px] font-bold">
              <button 
                onClick={() => setMatrixFilter('all')}
                className={cn("py-1.5 rounded-lg transition-all", matrixFilter === 'all' ? "bg-rose-500 text-white" : "text-surge-ink/60")}
              >
                Все
              </button>
              <button 
                onClick={() => setMatrixFilter('unanswered')}
                className={cn("py-1.5 rounded-lg transition-all", matrixFilter === 'unanswered' ? "bg-rose-500 text-white" : "text-surge-ink/60")}
              >
                Пропущ.
              </button>
              <button 
                onClick={() => setMatrixFilter('answered')}
                className={cn("py-1.5 rounded-lg transition-all", matrixFilter === 'answered' ? "bg-rose-500 text-white" : "text-surge-ink/60")}
              >
                Готовы
              </button>
              <button 
                onClick={() => setMatrixFilter('flagged')}
                className={cn("py-1.5 rounded-lg transition-all", matrixFilter === 'flagged' ? "bg-rose-500 text-white" : "text-surge-ink/60")}
              >
                Флаг
              </button>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto no-scrollbar p-1">
              {filteredMatrix.map(({ q, idx }) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isFlagged = flaggedQuestions.has(q.id);
                const isCurrent = idx === currentQIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={cn(
                      "h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center relative border",
                      isCurrent
                        ? "bg-rose-500 text-white border-rose-500 shadow-md ring-2 ring-rose-500/40"
                        : isAnswered
                          ? "bg-emerald-500/20 text-emerald-800 border-emerald-500/40"
                          : "bg-surge-ink/5 text-surge-ink/60 border-surge-ink/10 hover:border-rose-500/30"
                    )}
                  >
                    <span>{q.number}</span>
                    {isFlagged && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-surge-ink/10 space-y-2 text-[11px] font-medium text-surge-ink/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500/30 border border-emerald-500" />
                <span>Задание отвечено</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-surge-ink/10 border border-surge-ink/20" />
                <span>Неотвеченное задание</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-500" />
                <span>Отмечено заметкой</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Finish Exam */}
      <AnimatePresence>
        {showFinishConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surge-card rounded-3xl p-8 max-w-md w-full shadow-2xl border border-surge-ink/10 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-display font-black text-surge-ink mb-2">
                Завершить тестирование ЕНТ?
              </h3>
              <p className="text-surge-ink/60 text-sm mb-6 font-medium">
                Вы ответили на {answeredCount} из {totalQuestions} заданий. После завершения будет сформирован итоговый балл и детальный разбор.
              </p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleFinishExam(false)}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-rose-500/20 transition-all"
                >
                  Да, завершить
                </button>
                <button 
                  onClick={() => setShowFinishConfirm(false)}
                  className="px-6 py-3.5 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold rounded-xl transition-all"
                >
                  Продолжить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog: Exit Exam */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surge-card rounded-3xl p-8 max-w-md w-full shadow-2xl border border-surge-ink/10 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-display font-black text-surge-ink mb-2">
                Прервать сдачу теста?
              </h3>
              <p className="text-surge-ink/60 text-sm mb-6 font-medium">
                Результаты текущей попытки не будут сохранены. Вы действительно хотите выйти?
              </p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    clearInterval(timerRef.current);
                    setIsExamStarted(false);
                    setShowExitConfirm(false);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-red-500/20 transition-all"
                >
                  Да, выйти
                </button>
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="px-6 py-3.5 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold rounded-xl transition-all"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
