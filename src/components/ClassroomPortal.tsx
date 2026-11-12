import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Users, 
  Plus, 
  Copy, 
  Check, 
  Send, 
  AlertCircle, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Phone, 
  Sparkles, 
  FileText, 
  HelpCircle, 
  Layers, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight,
  ExternalLink,
  X,
  Target,
  Trophy,
  Flame,
  Award,
  Gift,
  Star,
  Calendar,
  Share2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Play,
  Pause,
  Volume2,
  MessageCircle,
  BarChart3,
  Edit3,
  Square,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { User, Classroom, ClassAssignment, TeacherMessage, QuizQuestion, EntQuest } from '../types';
import {
  db,
  auth,
  OperationType,
  handleFirestoreError,
  createUserProfile,
  updateUserProfile,
  updateXP,
  createClassroom,
  joinClassroomByCode,
  createClassAssignment,
  submitAssignmentScore,
  sendTeacherMessage
} from '../firebase';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { ai, Type, ThinkingLevel } from '../services/geminiService';

interface ClassroomPortalProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onAddXp: (amount: number) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToDept?: (deptId: any, initialPrompt?: string) => void;
  appLanguage: 'ru' | 'kk' | 'en';
}

export const SUBJECT_PRESETS: Record<string, {
  planGoal: string;
  planWeeks: { week: number; topic: string; tasks: string[] }[];
  fcTopic: string;
  cards: { front: string; back: string }[];
  quizTopic: string;
  quizzes: QuizQuestion[];
  testTopic: string;
  tests: QuizQuestion[];
}> = {
  'Химия': {
    planGoal: 'Подготовка к ЕНТ по Химии: от строения атома до органических реакций на 45+ баллов',
    planWeeks: [
      {
        week: 1,
        topic: 'Периодический закон, строение атома и химическая связь',
        tasks: ['Электронная конфигурация элементов', 'Типы кристаллической решетки', 'Степени окисления и ОВР']
      },
      {
        week: 2,
        topic: 'Классы неорганических соединений и гидролиз солей',
        tasks: ['Генетический ряд металлов и неметаллов', 'Реакции ионного обмена', 'Расчет pH и среды растворов']
      },
      {
        week: 3,
        topic: 'Органическая химия: углеводороды и кислородсодержащие соединения',
        tasks: ['Алканы, алкены, алкины и бензол', 'Спирты, альдегиды и карбоновые кислоты', 'Качественные реакции на функц. группы']
      },
      {
        week: 4,
        topic: 'Расчетные задачи ЕНТ на массовую долю выхода и смеси',
        tasks: ['Задачи на смеси веществ', 'Выход продукта реакции от теоретического', 'Полный тренировочный срез ЕНТ']
      }
    ],
    fcTopic: 'Химические формулы и качественные реакции ЕНТ',
    cards: [
      { front: 'Качественная реакция на катион Fe³⁺', back: 'Взаимодействие с KSCN (роданид калия) — кроваво-красный цвет; с NaOH — бурый осадок Fe(OH)3.' },
      { front: 'Общая формула гомологического ряда алкенов', back: 'CnH2n (наличие двойной связи C=C, sp²-гибридизация).' },
      { front: 'Молярный объем любого газа при н.у. (Vm)', back: 'Vm = 22.4 л/моль при 0 °C и давлении 101.3 кПа.' },
      { front: 'Окраска лакмуса в кислой и щелочной средах', back: 'В кислой среде — красный, в щелочной среде — синий, в нейтральной — фиолетовый.' }
    ],
    quizTopic: 'Экспресс-квиз: Строение атома и типы реакций',
    quizzes: [
      {
        question: 'Степень окисления фосфора в молекуле H3PO4 равна:',
        options: ['+5', '+3', '+1', '-3'],
        correctAnswerIndex: 0,
        explanation: 'Водород имеет +1 (3 атома = +3), кислород имеет -2 (4 атома = -8). +3 + x - 8 = 0 => x = +5.'
      },
      {
        question: 'Какое из перечисленных веществ окрашивает фенолфталеин в малиновый цвет?',
        options: ['Раствор NaOH (гидроксид натрия)', 'Раствор HCl (соляная кислота)', 'Дистиллированная вода', 'Раствор NaCl'],
        correctAnswerIndex: 0,
        explanation: 'Фенолфталеин меняет окраску на малиновую исключительно в щелочной среде (рН > 8.2).'
      },
      {
        question: 'К какому типу относится реакция: Zn + 2HCl → ZnCl2 + H2↑?',
        options: ['Реакция замещения', 'Реакция соединения', 'Реакция разложения', 'Реакция обмена'],
        correctAnswerIndex: 0,
        explanation: 'Атомы простого вещества замещают атомы водорода в сложной кислоте.'
      }
    ],
    testTopic: 'Пробный тест ЕНТ: Расчетные задачи и неорганическая химия',
    tests: [
      {
        question: 'Масса осадка, образующегося при взаимодействии 208 г 10%-ного раствора хлорида бария BaCl2 с избытком серной кислоты H2SO4, равна (M(BaCl2)=208 г/моль, M(BaSO4)=233 г/моль):',
        options: ['23.3 г', '20.8 г', '11.65 г', '46.6 г'],
        correctAnswerIndex: 0,
        explanation: 'Масса BaCl2 = 208 * 0.1 = 20.8 г (0.1 моль). BaCl2 + H2SO4 -> BaSO4↓ + 2HCl. n(BaSO4) = 0.1 моль. m = 0.1 * 233 = 23.3 г.'
      },
      {
        question: 'К какому классу углеводородов относится соединение с формулой C6H12, не обесцвечивающее бромную воду в стандартных условиях?',
        options: ['Циклоалканы (Циклогексан)', 'Алкены (Гексен)', 'Алканы', 'Алкины'],
        correctAnswerIndex: 0,
        explanation: 'Формула CnH2n характерна для алкенов и циклоалканов. Так как вещество не присоединяет бромную воду, это предельный циклон — циклогексан.'
      },
      {
        question: 'Объем углекислого газа CO2 (н.у.), выделившегося при полном термическом разложении 200 г карбоната кальция CaCO3, равен:',
        options: ['44.8 л', '22.4 л', '11.2 л', '89.6 л'],
        correctAnswerIndex: 0,
        explanation: 'n(CaCO3) = 200 / 100 = 2 моль. CaCO3 -> CaO + CO2↑. V(CO2) = 2 * 22.4 = 44.8 л.'
      },
      {
        question: 'Число неспаренных электронов в основном состоянии атома углерода (6C) равно:',
        options: ['2', '4', '0', '1'],
        correctAnswerIndex: 0,
        explanation: 'Электронная конфигурация углерода: 1s² 2s² 2p². На 2p подуровне находятся 2 неспаренных электрона.'
      }
    ]
  },
  'Физика': {
    planGoal: 'Интенсивная подготовка к ЕНТ по Физике: Механика, Динамика и Электродинамика',
    planWeeks: [
      {
        week: 1,
        topic: 'Кинематика: равноускоренное движение и баллистика',
        tasks: ['Повторить формулы S = (v^2 - v0^2) / 2a', 'Решить 15 тестовых задач ЕНТ', 'Пройти проверочный квиз']
      },
      {
        week: 2,
        topic: 'Динамика: Законы Ньютона, силы трения и упругости',
        tasks: ['Разобрать 3 закона Ньютона', 'Задачи на движение по наклонной плоскости', 'Сдать пробный срез учителю']
      },
      {
        week: 3,
        topic: 'Законы сохранения: импульс и механическая энергия',
        tasks: ['Закон сохранения импульса и удары', 'Потенциальная и кинетическая энергия', 'Решить расчетные задачи']
      },
      {
        week: 4,
        topic: 'Электростатика и законы постоянного тока',
        tasks: ['Закон Кулона и напряженность', 'Закон Ома для полной цепи', 'Итоговый контрольный срез']
      }
    ],
    fcTopic: 'Формулы Кинематики и Динамики ЕНТ',
    cards: [
      { front: 'Ускорение при равноускоренном движении (a)', back: 'a = (v - v0) / t. Единица измерения: м/с².' },
      { front: 'Второй закон Ньютона (F)', back: 'F = m * a. Равнодействующая всех сил сообщает телу ускорение.' },
      { front: 'Закон всемирного тяготения', back: 'F = G * (m1 * m2) / R². G ≈ 6.67 × 10^-11 Н·м²/кг².' },
      { front: 'Закон Ома для участка цепи', back: 'I = U / R. Сила тока прямо пропорциональна напряжению.' }
    ],
    quizTopic: 'Экспресс-квиз: Законы Ньютона и Силы',
    quizzes: [
      {
        question: 'Если равнодействующая всех сил, действующих на тело, равна нулю, то тело:',
        options: ['Покоится или движется прямолинейно и равномерно', 'Движется равноускоренно', 'Останавливается мгновенно', 'Движется по окружности'],
        correctAnswerIndex: 0,
        explanation: 'Первый закон Ньютона (закон инерции).'
      },
      {
        question: 'Какое ускорение приобретает тело массой 5 кг под действием силы 20 Н?',
        options: ['4 м/с²', '100 м/с²', '0.25 м/с²', '15 м/с²'],
        correctAnswerIndex: 0,
        explanation: 'a = F / m = 20 Н / 5 кг = 4 м/с².'
      },
      {
        question: 'Чему равна потенциальная энергия пружины жесткостью k = 200 Н/м, сжатой на x = 0.1 м?',
        options: ['1 Дж', '2 Дж', '20 Дж', '0.1 Дж'],
        correctAnswerIndex: 0,
        explanation: 'E = (k * x²) / 2 = (200 * 0.01) / 2 = 1 Дж.'
      }
    ],
    testTopic: 'Пробный тест ЕНТ: Механика и Электродинамика',
    tests: [
      {
        question: 'Уравнение движения материальной точки имеет вид x = 5 + 3t + 2t². Чему равно ускорение точки?',
        options: ['4 м/с²', '2 м/с²', '3 м/с²', '0 м/с²'],
        correctAnswerIndex: 0,
        explanation: 'В уравнении x = x0 + v0*t + (a/2)*t², a/2 = 2 => a = 4 м/с².'
      },
      {
        question: 'Какое количество теплоты выделится при сгорании 2 кг дров (удельная теплота сгорания q = 10 МДж/кг)?',
        options: ['20 МДж', '10 МДж', '5 МДж', '40 МДж'],
        correctAnswerIndex: 0,
        explanation: 'Q = q * m = 10 МДж/кг * 2 кг = 20 МДж.'
      },
      {
        question: 'Два резистора по 20 Ом соединены параллельно. Чему равно их общее сопротивление?',
        options: ['10 Ом', '40 Ом', '20 Ом', '5 Ом'],
        correctAnswerIndex: 0,
        explanation: 'R_общ = 20 / 2 = 10 Ом.'
      },
      {
        question: 'Период колебаний математического маятника длиной l = 1 м при g = 10 м/с² (π² ≈ 10) равен:',
        options: ['2 с', '1 с', '4 с', '0.5 с'],
        correctAnswerIndex: 0,
        explanation: 'T = 2π * √(l/g) = 2 * √(10/10) = 2 с.'
      }
    ]
  },
  'Математика': {
    planGoal: 'Комплексный курс подготовки к ЕНТ по профильной Математике (40+ баллов)',
    planWeeks: [
      {
        week: 1,
        topic: 'Алгебра: многочлены, формулы сокр. умножения и иррациональные уравнения',
        tasks: ['Формулы сокращенного умножения', 'Иррациональные уравнения и ОДЗ', 'Модули и системы неравенств']
      },
      {
        week: 2,
        topic: 'Тригонометрия: основные тождества, формулы приведения и уравнения',
        tasks: ['Табличные значения и формулы сложения', 'Тригонометрический круг и отбор корней', 'Сложные формулы двойных углов']
      },
      {
        week: 3,
        topic: 'Логарифмические и показательные уравнения и неравенства',
        tasks: ['Свойства логарифмов и потенцирование', 'Метод интервалов и замена переменной', 'Решение заданий ЕНТ']
      },
      {
        week: 4,
        topic: 'Планиметрия и стереометрия: треугольники, призмы, пирамиды и векторы',
        tasks: ['Теорема синусов и косинусов', 'Объемы тел вращения и призм', 'Итоговый контрольный срез']
      }
    ],
    fcTopic: 'Формулы Тригонометрии и Алгебры ЕНТ',
    cards: [
      { front: 'Основное тригонометрическое тождество', back: 'sin²(α) + cos²(α) = 1.' },
      { front: 'Формулы двойного угла для sin(2α) и cos(2α)', back: 'sin(2α) = 2*sin(α)*cos(α); cos(2α) = cos²(α) - sin²(α).' },
      { front: 'Теорема Виета для x² + px + q = 0', back: 'x1 + x2 = -p; x1 * x2 = q.' },
      { front: 'Производная произведения функций (u*v)\'', back: '(u * v)\' = u\' * v + u * v\'.' }
    ],
    quizTopic: 'Экспресс-квиз: Логарифмы и Производные',
    quizzes: [
      {
        question: 'Чему равно значение выражения log₂(32) + log₃(27)?',
        options: ['8', '5', '3', '15'],
        correctAnswerIndex: 0,
        explanation: 'log₂(32) = 5 (2⁵=32), log₃(27) = 3 (3³=27). 5 + 3 = 8.'
      },
      {
        question: 'Найдите производную функции f(x) = x³ - 4x² + 5x в точке x = 1:',
        options: ['0', '3', '-1', '5'],
        correctAnswerIndex: 0,
        explanation: 'f\'(x) = 3x² - 8x + 5. При x=1: 3(1) - 8(1) + 5 = 0.'
      },
      {
        question: 'Количество корней уравнения sin(x) = 2 на числовой прямой:',
        options: ['0 корней (нет решений)', '1 корень', 'Бесконечно много', '2 корня'],
        correctAnswerIndex: 0,
        explanation: 'Область значений синуса: [-1; 1]. Значение 2 недостижимо, решений нет.'
      }
    ],
    testTopic: 'Пробный тест ЕНТ: Профильная Математика',
    tests: [
      {
        question: 'Найдите сумму корней уравнения: x² - 7x + 12 = 0',
        options: ['7', '12', '-7', '-12'],
        correctAnswerIndex: 0,
        explanation: 'По теореме Виета x1 + x2 = -(-7) = 7 (корни 3 и 4).'
      },
      {
        question: 'Решите показательное уравнение: 3^(x + 2) - 3^x = 72',
        options: ['x = 2', 'x = 3', 'x = 1', 'x = 0'],
        correctAnswerIndex: 0,
        explanation: '3^x * (9 - 1) = 72 => 3^x * 8 = 72 => 3^x = 9 => x = 2.'
      },
      {
        question: 'Площадь прямоугольного треугольника с катетами 8 см и 15 см равна:',
        options: ['60 см²', '120 см²', '30 см²', '17 см²'],
        correctAnswerIndex: 0,
        explanation: 'S = (8 * 15) / 2 = 60 см².'
      },
      {
        question: 'Чему равна длина вектора a(3; -4)?',
        options: ['5', '7', '1', '25'],
        correctAnswerIndex: 0,
        explanation: '|a| = √(3² + (-4)²) = √25 = 5.'
      }
    ]
  },
  'История Казахстана': {
    planGoal: 'Подготовка к обязательному предмету ЕНТ: История Казахстана на 20 из 20',
    planWeeks: [
      {
        week: 1,
        topic: 'Древний Казахстан: Каменный, Бронзовый и Железный века (Саки, Гунны, Усуни)',
        tasks: ['Эпоха бронзы и андроновская культура', 'Сакские племена и Золотой человек', 'Войны гуннов и Великое переселение народов']
      },
      {
        week: 2,
        topic: 'Тюркский период (VI-XIII вв.) и государство Чингисхана',
        tasks: ['Тюркский, Западно-Тюркский и Тюргешский каганаты', 'Огузы, кимаки и кыпчаки', 'Монгольское нашествие и Золотая Орда']
      },
      {
        week: 3,
        topic: 'Образование и укрепление Казахского ханства (XV-XVIII вв.)',
        tasks: ['Керей и Жанибек (1465 г.)', 'Законы Касым хана, Есим хана и Тауке хана («Жеті Жарғы»)', 'Отечественная война против джунгар и Хан Абылай']
      },
      {
        week: 4,
        topic: 'Казахстан в XIX-XX веках и эпоха Независимости',
        tasks: ['Национально-освободительные восстания', 'Движение и партия «Алаш»', 'Провозглашение Независимости (16 декабря 1991 г.)']
      }
    ],
    fcTopic: 'Ключевые даты и правители Истории Казахстана ЕНТ',
    cards: [
      { front: '1465-1466 гг. в истории Казахстана', back: 'Основание Казахского ханства султанами Кереем и Жанибеком в урочище Козыбасы.' },
      { front: 'Хан Абылай (Абилмансур)', back: 'Выдающийся государь, правивший 1771-1781 гг. как хан всех трех жузов, проводивший политику объединения.' },
      { front: '1729-1730 гг. — Аныракайская битва', back: '«Место стонов и рыданий врага» — решающая победа объединенного ополчения трех жузов над джунгарами.' },
      { front: '16 декабря 1991 года', back: 'Принятие Конституционного закона «О государственной независимости Республики Казахстан».' }
    ],
    quizTopic: 'Экспресс-квиз: Правители и решающие битвы',
    quizzes: [
      {
        question: 'Свод степных законов «Жеті Жарғы» был принят при хане:',
        options: ['Тауке', 'Есиме', 'Касыме', 'Жангире'],
        correctAnswerIndex: 0,
        explanation: '«Жеті Жарғы» был разработан при хане Тауке при участии биев Толе би, Казыбек би и Айтеке би.'
      },
      {
        question: 'К какому союзу племен относится Иссыкский курган («Золотой человек»)?',
        options: ['Саки (саки-тиграхауда)', 'Усуни', 'Кангюи', 'Сарматы'],
        correctAnswerIndex: 0,
        explanation: 'Иссыкский курган (V-IV вв. до н.э.) открыт К. Акишевым и принадлежит сакам-тиграхауда.'
      },
      {
        question: 'В каком году проходил Курултай в Каракумах для объединения сил против джунгар?',
        options: ['1710 г.', '1723 г.', '1726 г.', '1730 г.'],
        correctAnswerIndex: 0,
        explanation: 'В 1710 году в песках Каракумы состоялся курултай, на котором было решено дать отпор джунгарам.'
      }
    ],
    testTopic: 'Пробный срез ЕНТ: История Казахстана (Обязательный блок)',
    tests: [
      {
        question: 'В каком году хан Абылай был официально признан ханом всех трех казахских жузов?',
        options: ['1771 г.', '1723 г.', '1748 г.', '1781 г.'],
        correctAnswerIndex: 0,
        explanation: 'В 1771 году в Туркестане Абылай был поднят на белой кошме как хан всех трех жузов.'
      },
      {
        question: 'Кто был председателем правительства автономии «Алаш-Орда» (декабрь 1917 г.)?',
        options: ['Алихан Букейханов', 'Ахмет Байтурсынов', 'Миржакып Дулатов', 'Мустафа Шокай'],
        correctAnswerIndex: 0,
        explanation: 'Алихан Букейханов был избран председателем правительства Автономии Алаш.'
      },
      {
        question: 'Период «Годы великого бедствия» («Ақтабан шұбырынды») начался в:',
        options: ['1723 г.', '1710 г.', '1729 г.', '1755 г.'],
        correctAnswerIndex: 0,
        explanation: 'В 1723 году опустошительное вторжение джунгарских войск Цеван-Рабдана вошло в историю как «Ақтабан шұбырынды».'
      },
      {
        question: 'Первая Конституция независимого Казахстана была принята:',
        options: ['28 января 1993 г.', '30 августа 1995 г.', '16 декабря 1991 г.', '25 октября 1990 г.'],
        correctAnswerIndex: 0,
        explanation: 'Первая Конституция суверенного Казахстана принята 28 января 1993 года. Действующая — 30 августа 1995 года.'
      }
    ]
  }
};

export const ClassroomPortal: React.FC<ClassroomPortalProps> = ({
  user,
  onUpdateUser,
  onAddXp,
  showToast,
  onNavigateToDept,
  appLanguage
}) => {
  const isTeacher = user.role === 'teacher';
  const initialTeacherSubject = user.teacherSubject || 'Химия';
  const initialPreset = SUBJECT_PRESETS[initialTeacherSubject] || SUBJECT_PRESETS['Химия'];

  // Classes state
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentsInClass, setStudentsInClass] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [messages, setMessages] = useState<TeacherMessage[]>([]);

  // Sub-tabs
  const [teacherTab, setTeacherTab] = useState<'students' | 'plans' | 'flashcards' | 'quizzes' | 'tests' | 'communications'>('students');
  const [studentTab, setStudentTab] = useState<'overview' | 'assignments' | 'quests' | 'communications'>('overview');

  // Plan Creator
  const [planGoal, setPlanGoal] = useState(initialPreset.planGoal);
  const [planSubject, setPlanSubject] = useState(initialTeacherSubject);
  const [planWeeksCount, setPlanWeeksCount] = useState(4);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlanWeeks, setGeneratedPlanWeeks] = useState<any[]>(initialPreset.planWeeks);

  // Flashcards Creator
  const [fcTopic, setFcTopic] = useState(initialPreset.fcTopic);
  const [fcSubject, setFcSubject] = useState(initialTeacherSubject);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<any[]>(initialPreset.cards);

  // Quiz Creator
  const [quizTopic, setQuizTopic] = useState(initialPreset.quizTopic);
  const [quizSubject, setQuizSubject] = useState(initialTeacherSubject);
  const [quizTimerSec, setQuizTimerSec] = useState(30);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generatedQuizList, setGeneratedQuizList] = useState<any[]>(initialPreset.quizzes);

  // Exam Test Creator
  const [testTopic, setTestTopic] = useState(initialPreset.testTopic);
  const [testSubject, setTestSubject] = useState(initialTeacherSubject);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [generatedTestList, setGeneratedTestList] = useState<QuizQuestion[]>(initialPreset.tests);

  // Communications & Media State
  const [commMode, setCommMode] = useState<'chat' | 'voice' | 'video'>('chat');
  const [chatInputText, setChatInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [isVideoSessionActive, setIsVideoSessionActive] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isVideoCameraOff, setIsVideoCameraOff] = useState(false);
  const [whiteboardText, setWhiteboardText] = useState('Формулы разбора урока ЕНТ:\n• F = m * a\n• v = v0 + a*t\n• S = (a * t^2) / 2\n• E = m*g*h + (m*v^2)/2');
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Modals
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);
  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false);
  const [isMessageStudentModalOpen, setIsMessageStudentModalOpen] = useState(false);
  const [isParentAlertModalOpen, setIsParentAlertModalOpen] = useState(false);
  const [activeStudentForModal, setActiveStudentForModal] = useState<User | null>(null);
  const [activeAssignmentToSolve, setActiveAssignmentToSolve] = useState<ClassAssignment | null>(null);

  // Forms
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('Физика и Мат. грамотность');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assignment Creation Form
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentType, setAssignmentType] = useState<'test' | 'quiz' | 'flashcards' | 'task' | 'plan'>('test');
  const [assignmentSubject, setAssignmentSubject] = useState('Физика');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('через 3 дня');
  const [isGeneratingAiAssignment, setIsGeneratingAiAssignment] = useState(false);
  const [generatedAiQuestions, setGeneratedAiQuestions] = useState<any[]>([]);

  // Direct Message & Parent Alert form
  const [directMessageText, setDirectMessageText] = useState('');
  const [parentAlertCustomNote, setParentAlertCustomNote] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Quiz / Test Solving state
  const [solvingAnswers, setSolvingAnswers] = useState<Record<number, number>>({});
  const [solveSubmitted, setSolveSubmitted] = useState(false);
  const [solveScore, setSolveScore] = useState(0);

  // Manual Add Student modal state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    email: '',
    targetScore: 125,
    currentScore: 85,
    parentName: '',
    parentContact: ''
  });

  // Interactive Flashcard solver state
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<number[]>([]);

  // Interactive Plan solver state
  const [checkedPlanTasks, setCheckedPlanTasks] = useState<Record<string, boolean>>({});

  // UNT Edit Score & Profiles State
  const [isEditEntModalOpen, setIsEditEntModalOpen] = useState(false);
  const [editCurrentScore, setEditCurrentScore] = useState(user.currentEntScore || 108);
  const [editTargetScore, setEditTargetScore] = useState(user.targetEntScore || 130);
  const [editProfileSub1, setEditProfileSub1] = useState(user.profileSubject1 || 'Физика');
  const [editProfileSub2, setEditProfileSub2] = useState(user.profileSubject2 || 'Математика (Профиль)');
  const [editHistoryScore, setEditHistoryScore] = useState(user.subjectScores?.history || 18);
  const [editMathLitScore, setEditMathLitScore] = useState(user.subjectScores?.mathLit || 8);
  const [editReadingLitScore, setEditReadingLitScore] = useState(user.subjectScores?.readingLit || 8);
  const [editProfile1Score, setEditProfile1Score] = useState(user.subjectScores?.profile1 || 37);
  const [editProfile2Score, setEditProfile2Score] = useState(user.subjectScores?.profile2 || 37);

  // UNT Quests
  const [quests, setQuests] = useState<EntQuest[]>([
    {
      id: 'quest_1',
      title: 'Пробный тест по Истории Казахстана',
      description: 'Решите минимум 15 тестовых заданий по обязательному предмету',
      xpReward: 50,
      category: 'tests',
      progress: user.testsCompleted ? Math.min(user.testsCompleted, 1) : 0,
      maxProgress: 1,
      completed: (user.testsCompleted || 0) >= 1
    },
    {
      id: 'quest_2',
      title: 'Мастер формул по профилю',
      description: 'Повторите 10 карточек или решите профильный блок (Физика / Химия)',
      xpReward: 40,
      category: 'study',
      progress: 5,
      maxProgress: 10,
      completed: false
    },
    {
      id: 'quest_3',
      title: 'Сдать задание от учителя',
      description: 'Выполните домашний пробный срез от преподавателя',
      xpReward: 60,
      category: 'assignments',
      progress: 0,
      maxProgress: 1,
      completed: false
    },
    {
      id: 'quest_4',
      title: 'Цель на Грант: 100+ баллов',
      description: 'Достигните отметки 100+ баллов на аналитике ЕНТ',
      xpReward: 100,
      category: 'tests',
      progress: user.currentEntScore || 108,
      maxProgress: 100,
      completed: (user.currentEntScore || 108) >= 100
    },
    {
      id: 'quest_5',
      title: '30 минут фокуса в таймере',
      description: 'Проведите 1 непрерывную Pomodoro-сессию подготовки к ЕНТ',
      xpReward: 50,
      category: 'study',
      progress: 25,
      maxProgress: 30,
      completed: false
    },
    {
      id: 'quest_6',
      title: 'Связь с учителем в чате',
      description: 'Отправьте вопрос или голосовое сообщение преподавателю',
      xpReward: 35,
      category: 'study',
      progress: 1,
      maxProgress: 1,
      completed: true
    },
    {
      id: 'quest_7',
      title: 'Экспресс-квиз без ошибок',
      description: 'Ответьте на все 5 вопросов квиза за минимальное время',
      xpReward: 80,
      category: 'assignments',
      progress: 4,
      maxProgress: 5,
      completed: false
    },
    {
      id: 'quest_8',
      title: 'Супермозг ЕНТ (120+ баллов)',
      description: 'Покорите порог 120 баллов для гарантированного 100% Гранта',
      xpReward: 150,
      category: 'tests',
      progress: user.currentEntScore || 108,
      maxProgress: 120,
      completed: (user.currentEntScore || 108) >= 120
    }
  ]);

  const handleClaimQuest = (questId: string) => {
    const q = quests.find(item => item.id === questId);
    if (!q || !q.completed || q.claimed) return;
    onAddXp(q.xpReward);
    setQuests(prev => prev.map(item => item.id === questId ? { ...item, claimed: true } : item));
    showToast(`Награда получена! +${q.xpReward} XP зачислено на ваш баланс ЕНТ`, 'success');
  };

  const handleLoadSubjectPreset = (subj: string) => {
    const p = SUBJECT_PRESETS[subj] || SUBJECT_PRESETS['Химия'];
    setPlanSubject(subj);
    setPlanGoal(p.planGoal);
    setGeneratedPlanWeeks(p.planWeeks);
    setFcSubject(subj);
    setFcTopic(p.fcTopic);
    setGeneratedCards(p.cards);
    setQuizSubject(subj);
    setQuizTopic(p.quizTopic);
    setGeneratedQuizList(p.quizzes);
    setTestSubject(subj);
    setTestTopic(p.testTopic);
    setGeneratedTestList(p.tests);
    showToast(`Загружен банк заданий ЕНТ по предмету «${subj}»!`, 'success');
  };

  // Load classrooms: check local/cached data and Firestore safely
  useEffect(() => {
    const isRealAuth = Boolean(auth.currentUser && !user.uid.startsWith('guest_') && !user.uid.startsWith('user_'));

    if (!isRealAuth) {
      try {
        const shared: Classroom[] = JSON.parse(localStorage.getItem('spyris_shared_classes') || '[]');
        let combined: Classroom[] = [];
        if (isTeacher) {
          const teacherKey = `spyris_classes_${user.uid}`;
          const teacherSaved = JSON.parse(localStorage.getItem(teacherKey) || '[]');
          const mine = shared.filter(c => c.teacherId === user.uid);
          const merged = [...mine, ...teacherSaved];
          const map = new Map();
          merged.forEach(c => map.set(c.id, c));
          combined = Array.from(map.values());
        } else {
          const studentKey = `spyris_student_classes_${user.uid}`;
          const studentSaved = JSON.parse(localStorage.getItem(studentKey) || '[]');
          const joined = shared.filter(c => (c.studentIds || []).includes(user.uid));
          const merged = [...studentSaved, ...joined];
          const map = new Map();
          merged.forEach(c => map.set(c.id, c));
          combined = Array.from(map.values());
        }

        if (combined.length > 0) {
          setClasses(combined);
          if (!selectedClassId || !combined.some(c => c.id === selectedClassId)) {
            setSelectedClassId(combined[0].id);
          }
        } else {
          setClasses([]);
          setSelectedClassId(null);
        }
      } catch (e) {
        setClasses([]);
        setSelectedClassId(null);
      }
      return;
    }

    // 2. Attach Firestore listener: for real auth Firestore is the source of truth
    try {
      const classesQuery = isTeacher 
        ? query(collection(db, 'classes'), where('teacherId', '==', user.uid))
        : query(collection(db, 'classes'), where('studentIds', 'array-contains', user.uid));

      const unsub = onSnapshot(classesQuery, (snapshot) => {
        const loadedClasses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Classroom));
        setClasses(loadedClasses);
        if (loadedClasses.length > 0) {
          if (!selectedClassId || !loadedClasses.some(c => c.id === selectedClassId)) {
            setSelectedClassId(loadedClasses[0].id);
          }
        } else {
          setSelectedClassId(null);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'classes');
      });

      return () => unsub();
    } catch (e) {
      console.warn("Classrooms listener setup error:", e);
    }
  }, [user.uid, isTeacher]);

  // Load assignments when selectedClassId changes
  useEffect(() => {
    if (!selectedClassId) {
      setAssignments([]);
      return;
    }

    // 1. Load locally cached assignments
    try {
      const localAsg = JSON.parse(localStorage.getItem(`spyris_shared_asg_${selectedClassId}`) || '[]');
      if (Array.isArray(localAsg) && localAsg.length > 0) {
        setAssignments(localAsg);
      } else {
        setAssignments([]);
      }
    } catch (e) {
      setAssignments([]);
    }

    // 2. Attach Firestore listener if authenticated
    const isRealAuth = Boolean(auth.currentUser && !user.uid.startsWith('guest_') && !user.uid.startsWith('user_'));
    if (!isRealAuth) return;

    try {
      const asgQuery = query(collection(db, 'assignments'), where('classId', '==', selectedClassId));
      const unsub = onSnapshot(asgQuery, (snapshot) => {
        const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClassAssignment));
        setAssignments(loaded.sort((a, b) => b.createdAt - a.createdAt));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'assignments');
      });

      return () => unsub();
    } catch (e) {
      console.warn("Assignments listener error:", e);
    }
  }, [selectedClassId, user.uid]);

  // Load students for teacher when selectedClassId changes
  useEffect(() => {
    if (!isTeacher || !selectedClassId) {
      setStudentsInClass([]);
      return;
    }
    
    // 1. Try local students list
    try {
      const localStudents = JSON.parse(localStorage.getItem(`spyris_class_students_${selectedClassId}`) || '[]');
      if (Array.isArray(localStudents)) {
        setStudentsInClass(localStudents);
      }
    } catch (e) {}

    const isRealAuth = Boolean(auth.currentUser && !user.uid.startsWith('guest_') && !user.uid.startsWith('user_'));
    if (!isRealAuth) return;

    const currentClass = classes.find(c => c.id === selectedClassId);
    if (!currentClass || !currentClass.studentIds || currentClass.studentIds.length === 0) {
      return;
    }

    const fetchStudents = async () => {
      try {
        const students: User[] = [];
        for (const sid of currentClass.studentIds) {
          const sSnap = await getDoc(doc(db, 'users', sid));
          if (sSnap.exists()) {
            students.push({ uid: sSnap.id, ...sSnap.data() } as User);
          }
        }
        if (students.length > 0) {
          setStudentsInClass(students);
        }
      } catch (e) {
        console.warn("Fetch class students notice:", e);
      }
    };
    fetchStudents();
  }, [selectedClassId, classes, isTeacher, user.uid]);

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Actions
  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      showToast("Введите название класса (например, «10 А — Химия»)", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const isRealAuth = Boolean(auth.currentUser && !user.uid.startsWith('guest_') && !user.uid.startsWith('user_'));
      let remote: Classroom | null = null;
      if (isRealAuth) {
        try {
          remote = ((await createClassroom(user.uid, user.name || 'Преподаватель ЕНТ', newClassName.trim(), newClassSubject)) as Classroom) || null;
        } catch (e) {
          console.warn("Firestore create class:", e);
        }
      }
      const created: Classroom = remote || {
        id: `class_${Date.now()}`,
        teacherId: user.uid,
        teacherName: user.name || 'Преподаватель ЕНТ',
        name: newClassName.trim(),
        subject: newClassSubject,
        code: `ENT-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: Date.now(),
        studentIds: []
      };

      setClasses(prev => [created, ...prev]);
      setSelectedClassId(created.id);
      setStudentsInClass([]);

      // Persist to localStorage for teacher and shared storage
      try {
        const teacherKey = `spyris_classes_${user.uid}`;
        const prevClasses: Classroom[] = JSON.parse(localStorage.getItem(teacherKey) || '[]');
        if (!prevClasses.some(c => c.id === created.id)) {
          localStorage.setItem(teacherKey, JSON.stringify([created, ...prevClasses]));
        }
        const shared: Classroom[] = JSON.parse(localStorage.getItem('spyris_shared_classes') || '[]');
        if (!shared.some(c => c.id === created.id)) {
          localStorage.setItem('spyris_shared_classes', JSON.stringify([created, ...shared]));
        }
      } catch (e) {}

      showToast(`Класс "${created.name}" создан! Код приглашения: ${created.code}`, "success");
      setNewClassName('');
      setIsCreateClassModalOpen(false);
    } catch (e: any) {
      showToast(e.message || "Ошибка создания класса", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCodeInput.trim()) {
      showToast("Введите код класса (например: ENT-8492)", "error");
      return;
    }
    setIsSubmitting(true);
    const codeClean = joinCodeInput.trim().toUpperCase();
    try {
      let targetClass: Classroom | undefined;

      if (auth.currentUser && !user.uid.startsWith('guest_') && !user.uid.startsWith('user_')) {
        try {
          targetClass = ((await joinClassroomByCode(user.uid, codeClean)) as Classroom) || undefined;
        } catch (e) {
          console.warn(e);
        }
      }

      if (!targetClass) {
        const sharedClasses: Classroom[] = JSON.parse(localStorage.getItem('spyris_shared_classes') || '[]');
        targetClass = sharedClasses.find(c => c.code.toUpperCase() === codeClean) || classes.find(c => c.code.toUpperCase() === codeClean);
      }

      if (targetClass) {
        const studentIds = targetClass.studentIds || [];
        if (!studentIds.includes(user.uid)) {
          targetClass.studentIds = [...studentIds, user.uid];
        }
        setClasses(prev => {
          if (prev.some(c => c.id === targetClass!.id)) return prev;
          return [targetClass!, ...prev];
        });
        setSelectedClassId(targetClass.id);

        try {
          const studentClasses = JSON.parse(localStorage.getItem(`spyris_student_classes_${user.uid}`) || '[]');
          if (!studentClasses.some((c: any) => c.id === targetClass!.id)) {
            localStorage.setItem(`spyris_student_classes_${user.uid}`, JSON.stringify([targetClass, ...studentClasses]));
          }
          // Also sync to class students roster
          const classStudents: any[] = JSON.parse(localStorage.getItem(`spyris_class_students_${targetClass.id}`) || '[]');
          if (!classStudents.some((s: any) => s.uid === user.uid)) {
            classStudents.push({
              uid: user.uid,
              name: user.name || 'Ученик',
              email: user.email || '',
              role: 'student',
              currentEntScore: user.currentEntScore || 85,
              targetEntScore: user.targetEntScore || 125,
              school: user.school || 'ЕНТ класс',
              parentName: user.parentName,
              parentContact: user.parentContact,
              xp: user.xp || 1200
            });
            localStorage.setItem(`spyris_class_students_${targetClass.id}`, JSON.stringify(classStudents));
          }

          // Also sync to teacher classes storage
          const shared: Classroom[] = JSON.parse(localStorage.getItem('spyris_shared_classes') || '[]');
          const updatedShared = shared.map(c => c.id === targetClass!.id ? targetClass! : c);
          localStorage.setItem('spyris_shared_classes', JSON.stringify(updatedShared));

          const teacherClassesKey = `spyris_classes_${targetClass!.teacherId}`;
          const teacherClasses: Classroom[] = JSON.parse(localStorage.getItem(teacherClassesKey) || '[]');
          const updatedTeacherClasses = teacherClasses.map(c => c.id === targetClass!.id ? targetClass! : c);
          if (!updatedTeacherClasses.some(c => c.id === targetClass!.id)) {
            updatedTeacherClasses.unshift(targetClass!);
          }
          localStorage.setItem(teacherClassesKey, JSON.stringify(updatedTeacherClasses));
        } catch (e) {}

        showToast(`Вы успешно присоединились к классу "${targetClass.name}"!`, "success");
        setJoinCodeInput('');
        setIsJoinClassModalOpen(false);
        onAddXp(50);
      } else {
        showToast(`Класс с кодом "${codeClean}" не найден. Уточните код у учителя.`, "error");
      }
    } catch (e: any) {
      showToast(e.message || "Ошибка присоединения к классу", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStudentToClass = () => {
    if (!newStudentForm.name.trim()) {
      showToast("Укажите имя и фамилию ученика", "error");
      return;
    }
    if (!selectedClassId) {
      showToast("Сначала выберите или создайте класс", "error");
      return;
    }
    const studentUid = `student_real_${Date.now()}`;
    const newStudent: User = {
      uid: studentUid,
      name: newStudentForm.name.trim(),
      email: newStudentForm.email.trim() || `${newStudentForm.name.trim().toLowerCase().replace(/\s+/g, '.')}@ent.kz`,
      role: 'student',
      targetEntScore: Number(newStudentForm.targetScore) || 125,
      currentEntScore: Number(newStudentForm.currentScore) || 85,
      parentName: newStudentForm.parentName.trim() || 'Родитель',
      parentContact: newStudentForm.parentContact.trim() || '+7 (701) 000-00-00',
      level: 2,
      xp: 1200,
      rank: Number(newStudentForm.currentScore) >= 100 ? 'Кандидат на Грант' : 'Старательный ученик',
      badges: ['ENT_PIONEER']
    };

    setStudentsInClass(prev => [newStudent, ...prev]);
    setClasses(prev => prev.map(c => {
      if (c.id === selectedClassId) {
        const studentIds = c.studentIds || [];
        return { ...c, studentIds: [...studentIds, studentUid] };
      }
      return c;
    }));

    try {
      const updated = [newStudent, ...studentsInClass];
      localStorage.setItem(`spyris_class_students_${selectedClassId}`, JSON.stringify(updated));
    } catch (e) {}

    setNewStudentForm({
      name: '',
      email: '',
      targetScore: 125,
      currentScore: 85,
      parentName: '',
      parentContact: ''
    });
    setIsAddStudentModalOpen(false);
    showToast(`Ученик ${newStudent.name} добавлен в журнал класса!`, "success");
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(`Код ${code} скопирован в буфер обмена!`, "success");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Generate Assignment with AI
  const handleGenerateAiAssignment = async () => {
    if (!assignmentTitle.trim()) {
      showToast("Сначала укажите тему задания (например, Механика или Ханство Абылая)", "info");
      return;
    }
    setIsGeneratingAiAssignment(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Создай 3 качественных вопроса формата ЕНТ (Казахстан) по предмету "${assignmentSubject}" на тему: "${assignmentTitle}". 
Верни строго JSON массив объектов с ключами:
- question (текст вопроса)
- options (массив из 4 вариантов ответов на русском языке)
- correctAnswerIndex (индекс 0-3 правильного ответа)
- explanation (краткое и понятное объяснение решения)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswerIndex", "explanation"]
            }
          },
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const raw = response.text || response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('') || "[]";
      const match = raw.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(match ? match[0] : raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGeneratedAiQuestions(parsed);
        showToast("ИИ успешно сгенерировал вопросы ЕНТ для задания!", "success");
      }
    } catch (e: any) {
      console.error(e);
      showToast("Ошибка генерации вопросов ИИ, попробуйте еще раз", "error");
    } finally {
      setIsGeneratingAiAssignment(false);
    }
  };

  // Dispatch Assignment to Class
  const handleDispatchAssignment = async () => {
    if (!assignmentTitle.trim() || !selectedClassId) {
      showToast("Заполните название задания", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const newAsg: ClassAssignment = {
        id: `asg_${Date.now()}`,
        classId: selectedClassId,
        teacherId: user.uid,
        teacherName: user.name || 'Преподаватель ЕНТ',
        title: assignmentTitle.trim(),
        type: assignmentType,
        subject: assignmentSubject,
        description: assignmentDesc.trim() || 'Выполните срез знаний по формату ЕНТ.',
        deadline: assignmentDeadline,
        createdAt: Date.now(),
        contentData: generatedAiQuestions.length > 0 ? generatedAiQuestions : [
          {
            question: `Проверочный вопрос по теме: ${assignmentTitle}`,
            options: ['Вариант A', 'Вариант B (правильный)', 'Вариант C', 'Вариант D'],
            correctAnswerIndex: 1,
            explanation: 'Правильный ответ основан на стандартной программе ЕНТ.'
          }
        ],
        submissions: {}
      };

      setAssignments(prev => [newAsg, ...prev]);

      try {
        const prevShared = JSON.parse(localStorage.getItem(`spyris_shared_asg_${selectedClassId}`) || '[]');
        localStorage.setItem(`spyris_shared_asg_${selectedClassId}`, JSON.stringify([newAsg, ...prevShared]));
      } catch (e) {}

      if (auth.currentUser && !user.uid.startsWith('guest_') && !user.uid.startsWith('user_')) {
        try {
          await createClassAssignment(newAsg);
        } catch (e) {
          console.warn("Firestore sync asg notice:", e);
        }
      }

      showToast(`Задание "${newAsg.title}" отправлено классу!`, "success");
      setAssignmentTitle('');
      setAssignmentDesc('');
      setGeneratedAiQuestions([]);
      setIsCreateAssignmentModalOpen(false);
    } catch (e: any) {
      showToast(e.message || "Ошибка отправки задания", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Direct Message to Student
  const handleSendDirectMessage = async () => {
    if (!activeStudentForModal || !directMessageText.trim()) return;
    try {
      const msg = {
        senderId: user.uid,
        senderName: user.name || 'Преподаватель ЕНТ',
        senderRole: 'teacher' as const,
        receiverId: activeStudentForModal.uid,
        classId: selectedClassId || undefined,
        content: directMessageText.trim(),
        type: 'motivation' as const
      };

      if (user.uid.startsWith('guest_')) {
        setMessages(prev => [{ ...msg, id: `msg_${Date.now()}`, timestamp: Date.now() }, ...prev]);
      } else {
        await sendTeacherMessage(msg);
      }

      showToast(`Сообщение отправлено ученику ${activeStudentForModal.name}!`, "success");
      setDirectMessageText('');
      setIsMessageStudentModalOpen(false);
    } catch (e: any) {
      showToast(e.message || "Ошибка отправки сообщения", "error");
    }
  };

  // AI Plan Generator (Teacher)
  const handleGenerateAiPlan = async () => {
    if (!planGoal.trim()) {
      showToast("Укажите цель плана подготовки к ЕНТ", "info");
      return;
    }
    setIsGeneratingPlan(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Составь структурированный учебный план подготовки к ЕНТ (Казахстан) по предмету "${planSubject}" на ${planWeeksCount} недели. Цель: "${planGoal}".
Верни строго JSON массив объектов (по количеству недель):
- week (номер недели: 1, 2, ...)
- topic (главная тема недели)
- tasks (массив из 2-3 конкретных задач и формул)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                week: { type: Type.INTEGER },
                topic: { type: Type.STRING },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["week", "topic", "tasks"]
            }
          },
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      const raw = response.text || response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('') || "[]";
      const match = raw.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(match ? match[0] : raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGeneratedPlanWeeks(parsed);
        showToast("Учебный план подготовки к ЕНТ сгенерирован!", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("ИИ составил базовый план подготовки к ЕНТ", "info");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // AI Flashcards Generator (Teacher)
  const handleGenerateAiFlashcards = async () => {
    if (!fcTopic.trim()) {
      showToast("Укажите тему для флеш-карточек", "info");
      return;
    }
    setIsGeneratingCards(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Создай 4 карточки формата ЕНТ по предмету "${fcSubject}" на тему: "${fcTopic}".
Верни строго JSON массив объектов:
- front (термин, закон, дата или формула)
- back (краткое и точное определение, единицы измерения или решение)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING }
              },
              required: ["front", "back"]
            }
          },
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      const raw = response.text || response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('') || "[]";
      const match = raw.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(match ? match[0] : raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGeneratedCards(parsed);
        showToast("Флеш-карточки ЕНТ успешно созданы!", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Ошибка генерации карточек, попробуйте снова", "error");
    } finally {
      setIsGeneratingCards(false);
    }
  };

  // AI Quiz Generator (Teacher)
  const handleGenerateAiQuiz = async () => {
    if (!quizTopic.trim()) {
      showToast("Укажите тему для квиза", "info");
      return;
    }
    setIsGeneratingQuiz(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Создай 3 экспресс-вопроса ЕНТ по предмету "${quizSubject}" на тему: "${quizTopic}".
Верни строго JSON массив объектов:
- question (вопрос)
- options (4 варианта ответа)
- correctAnswerIndex (0-3)
- explanation (краткое объяснение)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswerIndex", "explanation"]
            }
          },
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      const raw = response.text || response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('') || "[]";
      const match = raw.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(match ? match[0] : raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGeneratedQuizList(parsed);
        showToast("Экспресс-квиз ЕНТ сгенерирован!", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Ошибка генерации квиза", "error");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // AI Exam Test Generator (Teacher)
  const handleGenerateAiExamTest = async () => {
    if (!testTopic.trim()) {
      showToast("Укажите тему для теста ЕНТ", "info");
      return;
    }
    setIsGeneratingTest(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Создай 4 профильных задания формата ЕНТ (Казахстан) по предмету "${testSubject}" на тему: "${testTopic}".
Верни строго JSON массив объектов:
- question (условие задачи с числовыми данными)
- options (4 варианта ответа)
- correctAnswerIndex (0-3)
- explanation (подробный пошаговый расчет и формулы)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswerIndex", "explanation"]
            }
          },
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      const raw = response.text || response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('') || "[]";
      const match = raw.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(match ? match[0] : raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGeneratedTestList(parsed);
        showToast("Пробный тест ЕНТ успешно составлен!", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Ошибка генерации теста", "error");
    } finally {
      setIsGeneratingTest(false);
    }
  };

  // Dispatch any created material to class
  const handleDispatchMaterial = async (
    type: 'plan' | 'flashcards' | 'quiz' | 'test',
    title: string,
    content: any,
    deadline: string = 'через 3 дня'
  ) => {
    let targetClassId = selectedClassId;
    if (!targetClassId && classes.length > 0) {
      targetClassId = classes[0].id;
      setSelectedClassId(targetClassId);
    }
    if (!targetClassId) {
      showToast("Сначала создайте класс (нажмите «Создать класс» во вкладке «Ученики»)", "error");
      return;
    }
    const currentClass = classes.find(c => c.id === targetClassId) || classes[0];

    // Ensure contentData is never empty
    let finalContent = content;
    if (!finalContent || (Array.isArray(finalContent) && finalContent.length === 0)) {
      const preset = SUBJECT_PRESETS[currentClass?.subject || testSubject || 'Химия'] || SUBJECT_PRESETS['Химия'];
      if (type === 'test') finalContent = preset.tests;
      else if (type === 'quiz') finalContent = preset.quizzes;
      else if (type === 'flashcards') finalContent = preset.cards;
      else if (type === 'plan') finalContent = preset.planWeeks;
    }

    const newAsg: ClassAssignment = {
      id: `asg_${Date.now()}`,
      classId: targetClassId,
      teacherId: user.uid,
      teacherName: user.name || 'Преподаватель ЕНТ',
      title,
      type,
      subject: currentClass?.subject || user.teacherSubject || 'ЕНТ',
      description: type === 'plan' ? 'Индивидуальный/групповой план подготовки к ЕНТ.' :
                   type === 'flashcards' ? 'Комплект флеш-карточек с формулами и терминами ЕНТ.' :
                   type === 'quiz' ? 'Экспресс-квиз с таймером.' : 'Пробный срез формата ЕНТ.',
      deadline,
      createdAt: Date.now(),
      contentData: finalContent,
      submissions: {}
    };

    setAssignments(prev => [newAsg, ...prev]);

    try {
      const prevShared = JSON.parse(localStorage.getItem(`spyris_shared_asg_${selectedClassId}`) || '[]');
      localStorage.setItem(`spyris_shared_asg_${selectedClassId}`, JSON.stringify([newAsg, ...prevShared]));
    } catch (e) {}

    if (auth.currentUser && !user.uid.startsWith('guest_') && !user.uid.startsWith('user_')) {
      try {
        await createClassAssignment(newAsg);
      } catch (e) {
        console.warn("Firestore sync asg notice:", e);
      }
    }

    showToast(`Материал «${title}» опубликован и отправлен ученикам!`, "success");
    if (isTeacher) setTeacherTab('students');
  };

  // Communications Handlers
  const handleSendChatMessage = async () => {
    if (!chatInputText.trim()) return;
    const msg: TeacherMessage = {
      id: `msg_${Date.now()}`,
      senderId: user.uid,
      senderName: user.name || (isTeacher ? 'Преподаватель' : 'Ученик'),
      senderRole: isTeacher ? 'teacher' : 'student',
      receiverId: isTeacher ? 'class_all' : (selectedClass?.teacherId || 'teacher_demo_1'),
      classId: selectedClassId || 'demo_class_1',
      content: chatInputText.trim(),
      timestamp: Date.now(),
      type: 'message'
    };

    if (user.uid.startsWith('guest_')) {
      setMessages(prev => [msg, ...prev]);
    } else {
      await sendTeacherMessage(msg);
    }
    setChatInputText('');
    showToast("Сообщение отправлено!", "success");
  };

  const handleToggleVoiceRecording = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      // Simulate voice note recorded
      const msg: TeacherMessage = {
        id: `msg_${Date.now()}`,
        senderId: user.uid,
        senderName: user.name || (isTeacher ? 'Преподаватель' : 'Ученик'),
        senderRole: isTeacher ? 'teacher' : 'student',
        receiverId: 'class_all',
        classId: selectedClassId || 'demo_class_1',
        content: `🎤 Голосовое сообщение (${voiceSeconds || 5} сек): Разбор сложной задачи ЕНТ и напутствие.`,
        timestamp: Date.now(),
        type: 'voice_note'
      };
      setMessages(prev => [msg, ...prev]);
      setVoiceSeconds(0);
      showToast("Голосовая заметка сохранена и отправлена!", "success");
    } else {
      setIsRecordingVoice(true);
      setVoiceSeconds(0);
      showToast("Запись голосового сообщения началась... Говорите!", "info");
    }
  };

  const handleToggleVideoSession = async () => {
    if (isVideoSessionActive) {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(t => t.stop());
        videoStreamRef.current = null;
      }
      setIsVideoSessionActive(false);
      showToast("Видеоразбор завершен", "info");
    } else {
      setIsVideoSessionActive(true);
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          videoStreamRef.current = stream;
          if (videoElementRef.current) {
            videoElementRef.current.srcObject = stream;
          }
        }
      } catch (e) {
        console.log("Webcam preview using fallback mode:", e);
      }
      showToast("Видеоразбор ЕНТ запущен! Доска и связь активны.", "success");
    }
  };

  // Solve Assignment
  const handleSubmitSolving = async () => {
    if (!activeAssignmentToSolve || !activeAssignmentToSolve.contentData) return;
    const questions: QuizQuestion[] = activeAssignmentToSolve.contentData;
    let correct = 0;
    questions.forEach((q, idx) => {
      if (solvingAnswers[idx] === q.correctAnswerIndex) {
        correct++;
      }
    });

    const calculatedScore = Math.round((correct / questions.length) * 100);
    setSolveScore(calculatedScore);
    setSolveSubmitted(true);

    try {
      if (user.uid.startsWith('guest_')) {
        // update local
        setAssignments(prev => prev.map(a => {
          if (a.id === activeAssignmentToSolve.id) {
            const subs = a.submissions || {};
            subs[user.uid] = {
              studentId: user.uid,
              studentName: user.name || 'Ученик ЕНТ',
              score: calculatedScore,
              completedAt: Date.now(),
              status: 'completed'
            };
            return { ...a, submissions: subs };
          }
          return a;
        }));
      } else {
        await submitAssignmentScore(activeAssignmentToSolve.id, user.uid, user.name || 'Ученик', calculatedScore);
      }

      onAddXp(calculatedScore);
      showToast(`Задание сдано! Ваш результат: ${calculatedScore}% (+${calculatedScore} XP)`, "success");

      // Update quests
      setQuests(prev => prev.map(q => q.id === 'quest_3' ? { ...q, progress: 1, completed: true } : q));
    } catch (e: any) {
      showToast(e.message || "Ошибка сохранения результата", "error");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Banner: UNT Focus & Classroom Identity */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 border-2 border-teal-500/30 bg-surge-card shadow-2xl">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-surge-purple/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 font-bold text-xs uppercase tracking-widest">
              <GraduationCap size={16} />
              <span>{isTeacher ? '👨‍🏫 Кабинет Преподавателя ЕНТ' : '🎓 Персональная подготовка к ЕНТ 2026'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-black text-surge-ink tracking-tight">
              {isTeacher ? 'Управление классами и Мониторинг ЕНТ' : 'Мой класс, Задания и Контроль учителем'}
            </h2>
            <p className="text-surge-ink/60 text-sm max-w-2xl font-medium leading-relaxed">
              {isTeacher 
                ? 'Создавайте группы, следите за текущей готовностью учеников к ЕНТ (из 140 баллов), выдавайте проверочные срезы и мотивируйте отстающих.'
                : 'Ваш учитель видит ваш прогресс, выдает индивидуальные пробные тесты и помогает разобрать сложные вопросы для получения Гранта.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isTeacher ? (
              <>
                <button
                  onClick={() => setIsCreateClassModalOpen(true)}
                  className="px-6 py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl shadow-xl shadow-teal-500/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
                >
                  <Plus size={18} />
                  <span>Создать класс</span>
                </button>
                <button
                  onClick={() => setIsCreateAssignmentModalOpen(true)}
                  disabled={!selectedClass}
                  className="px-6 py-3.5 bg-surge-purple hover:bg-surge-purple-dark text-white font-bold rounded-2xl shadow-xl shadow-surge-purple/20 transition-all active:scale-95 flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <Sparkles size={18} />
                  <span>Дать задание классу</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsJoinClassModalOpen(true)}
                className="px-6 py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl shadow-xl shadow-teal-500/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
              >
                <Plus size={18} />
                <span>Вступить в класс по коду</span>
              </button>
            )}
          </div>
        </div>

        {/* Classes Horizontal Selector & Class Code Badge */}
        {classes.length > 0 && (
          <div className="mt-8 pt-6 border-t border-surge-ink/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 max-w-full">
              <span className="text-xs font-bold text-surge-ink/40 uppercase tracking-widest mr-2 whitespace-nowrap">
                {isTeacher ? 'Ваши классы:' : 'Ваш класс:'}
              </span>
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                    selectedClassId === c.id
                      ? "bg-teal-500 text-white shadow-md shadow-teal-500/30 scale-105"
                      : "bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink/70"
                  )}
                >
                  <BookOpen size={14} />
                  <span>{c.name}</span>
                  <span className="opacity-60 text-[10px]">({c.subject})</span>
                </button>
              ))}
            </div>

            {selectedClass && (
              <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 px-4 py-2 rounded-xl">
                <span className="text-xs text-surge-ink/60 font-medium">Код для учеников:</span>
                <span className="font-mono font-black text-teal-400 tracking-wider text-sm">{selectedClass.code}</span>
                <button 
                  onClick={() => handleCopyCode(selectedClass.code)}
                  className="p-1 hover:text-teal-400 text-surge-ink/50 transition-colors"
                  title="Скопировать код"
                >
                  {copiedCode ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {isTeacher ? (
          <>
            <button
              onClick={() => setTeacherTab('students')}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
                teacherTab === 'students' ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25" : "bg-surge-card text-surge-ink/70 hover:bg-surge-ink/5 border border-surge-ink/10"
              )}
            >
              <Users size={16} />
              <span>Журнал учеников ({studentsInClass.length})</span>
            </button>
            <button
              onClick={() => setTeacherTab('plans')}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
                teacherTab === 'plans' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" : "bg-surge-card text-surge-ink/70 hover:bg-surge-ink/5 border border-surge-ink/10"
              )}
            >
              <Calendar size={16} />
              <span>Планы обучения ЕНТ</span>
            </button>
            <button
              onClick={() => setTeacherTab('flashcards')}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
                teacherTab === 'flashcards' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "bg-surge-card text-surge-ink/70 hover:bg-surge-ink/5 border border-surge-ink/10"
              )}
            >
              <Layers size={16} />
              <span>Создание флеш-карт</span>
            </button>
            <button
              onClick={() => setTeacherTab('quizzes')}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
                teacherTab === 'quizzes' ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25" : "bg-surge-card text-surge-ink/70 hover:bg-surge-ink/5 border border-surge-ink/10"
              )}
            >
              <HelpCircle size={16} />
              <span>Создание квизов</span>
            </button>
            <button
              onClick={() => setTeacherTab('tests')}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
                teacherTab === 'tests' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25" : "bg-surge-card text-surge-ink/70 hover:bg-surge-ink/5 border border-surge-ink/10"
              )}
            >
              <FileText size={16} />
              <span>Пробные тесты ЕНТ</span>
            </button>
            <button
              onClick={() => setTeacherTab('communications')}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
                teacherTab === 'communications' ? "bg-surge-purple text-white shadow-lg shadow-surge-purple/25" : "bg-surge-card text-surge-ink/70 hover:bg-surge-ink/5 border border-surge-ink/10"
              )}
            >
              <MessageCircle size={16} />
              <span>Чат, Голос & Видео</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setStudentTab('overview')}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
                studentTab === 'overview' ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25" : "bg-surge-card text-surge-ink/70 hover:bg-surge-ink/5 border border-surge-ink/10"
              )}
            >
              <BarChart3 size={16} />
              <span>Мой класс & Прогресс ЕНТ</span>
            </button>
            <button
              onClick={() => setStudentTab('assignments')}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
                studentTab === 'assignments' ? "bg-surge-purple text-white shadow-lg shadow-surge-purple/25" : "bg-surge-card text-surge-ink/70 hover:bg-surge-ink/5 border border-surge-ink/10"
              )}
            >
              <FileText size={16} />
              <span>Задания от учителя ({assignments.length})</span>
            </button>
            <button
              onClick={() => setStudentTab('quests')}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
                studentTab === 'quests' ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/25" : "bg-surge-card text-surge-ink/70 hover:bg-surge-ink/5 border border-surge-ink/10"
              )}
            >
              <Flame size={16} />
              <span>ЕНТ Квесты и Награды ({quests.filter(q => q.completed).length}/{quests.length})</span>
            </button>
            <button
              onClick={() => setStudentTab('communications')}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap",
                studentTab === 'communications' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" : "bg-surge-card text-surge-ink/70 hover:bg-surge-ink/5 border border-surge-ink/10"
              )}
            >
              <MessageCircle size={16} />
              <span>Связь с учителем</span>
            </button>
          </>
        )}
      </div>

      {/* Main Content Sections: Depends on Role */}
      {isTeacher ? (
        /* ================= TEACHER DASHBOARD ================= */
        <div className="space-y-8">
          {classes.length === 0 ? (
            <div className="bg-surge-card rounded-[2.5rem] p-10 md:p-14 border-2 border-dashed border-teal-500/40 text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto text-4xl">
                👨‍🏫
              </div>
              <div className="max-w-lg mx-auto space-y-2">
                <h3 className="text-2xl font-bold text-surge-ink">Добро пожаловать в Кабинет Учителя ЕНТ!</h3>
                <p className="text-xs text-surge-ink/60 leading-relaxed">
                  У вас пока нет созданных классов. Создайте класс (например: <strong>«10 А — Химия»</strong> или <strong>«11 Б — ФизМат»</strong>), чтобы получить уникальный код для подключения ваших реальных учеников и отправки им заданий.
                </p>
              </div>
              <button
                onClick={() => setIsCreateClassModalOpen(true)}
                className="px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl shadow-xl shadow-teal-500/25 transition-all text-sm inline-flex items-center gap-2 active:scale-95"
              >
                <Plus size={18} />
                <span>+ Создать первый класс</span>
              </button>
            </div>
          ) : teacherTab === 'students' && (
            <>
              {/* Section 1: Students Progress Table & Attention Radar */}
              <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 border-2 border-surge-ink/10 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-display font-bold text-surge-ink flex items-center gap-2">
                  <Users className="text-teal-400" size={24} />
                  <span>Успеваемость учеников класса {selectedClass ? `«${selectedClass.name}»` : ''}</span>
                </h3>
                <p className="text-surge-ink/50 text-xs font-medium mt-1">
                  Текущие результаты пробных срезов ЕНТ, цели на грант и статус активности
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95"
                >
                  <UserPlus size={14} /> + Добавить ученика вручную
                </button>
                {selectedClass && (
                  <button
                    onClick={() => handleCopyCode(selectedClass.code)}
                    className="px-4 py-2.5 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Copy size={14} /> Код класса: {selectedClass.code}
                  </button>
                )}
              </div>
            </div>

            {studentsInClass.length === 0 ? (
              <div className="p-10 rounded-2xl bg-surge-ink/5 border border-dashed border-surge-ink/20 text-center space-y-4">
                <Users size={48} className="mx-auto text-surge-ink/30" />
                <h4 className="font-bold text-surge-ink text-base">В этом классе пока нет учеников</h4>
                <p className="text-xs text-surge-ink/50 max-w-md mx-auto">
                  Отправьте ученикам код приглашения <strong className="text-teal-400 font-mono text-sm">{selectedClass?.code || 'ENT-XXXX'}</strong>, или добавьте ваших реальных учеников вручную.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-xs transition-all inline-flex items-center gap-2 shadow-md shadow-teal-500/20"
                  >
                    <UserPlus size={14} /> + Добавить ученика вручную
                  </button>
                  <button
                    onClick={() => selectedClass && handleCopyCode(selectedClass.code)}
                    className="px-5 py-2.5 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-2"
                  >
                    <Copy size={14} /> Скопировать код класса
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surge-ink/10 text-[11px] font-bold text-surge-ink/40 uppercase tracking-wider">
                      <th className="py-3 px-4">Ученик</th>
                      <th className="py-3 px-4">Готовность к ЕНТ</th>
                      <th className="py-3 px-4">Текущий балл</th>
                      <th className="py-3 px-4">Цель (Грант)</th>
                      <th className="py-3 px-4">Статус</th>
                      <th className="py-3 px-4 text-right">Действия учителя</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surge-ink/5">
                    {studentsInClass.map(s => {
                      const score = s.currentEntScore || 70;
                      const isLow = score < 65;
                      const isHigh = score >= 95;
                      return (
                        <tr key={s.uid} className="hover:bg-surge-ink/[0.02] transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-surge-purple/20 border border-surge-purple/30 flex items-center justify-center font-bold text-surge-purple text-sm overflow-hidden">
                                {s.photoURL ? <img src={s.photoURL} alt="" className="w-full h-full object-cover" /> : s.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-surge-ink">{s.name}</p>
                                <p className="text-[11px] text-surge-ink/40">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span>{Math.round((score / 140) * 100)}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-surge-ink/10 overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    isLow ? "bg-rose-500" : isHigh ? "bg-emerald-500" : "bg-amber-500"
                                  )}
                                  style={{ width: `${Math.min(100, Math.round((score / 140) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-surge-ink">
                            <span className={cn(isLow ? "text-rose-500 font-black" : isHigh ? "text-emerald-500" : "text-amber-500")}>
                              {score}
                            </span>
                            <span className="text-surge-ink/40 text-xs"> / 140</span>
                          </td>
                          <td className="py-4 px-4 font-mono text-xs font-bold text-surge-ink/70">
                            {s.targetEntScore || 125} баллов
                          </td>
                          <td className="py-4 px-4">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold">
                                <AlertCircle size={10} /> Требует внимания
                              </span>
                            ) : isHigh ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                                <CheckCircle2 size={10} /> Отличный темп
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold">
                                <TrendingUp size={10} /> Стабильно
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setActiveStudentForModal(s);
                                  setDirectMessageText(`Привет, ${s.name}! Обратил внимание на твои последние результаты. Давай подтянем сложные темы!`);
                                  setIsMessageStudentModalOpen(true);
                                }}
                                className="p-2 hover:bg-surge-purple/10 text-surge-purple rounded-xl border border-surge-purple/20 transition-all text-xs font-bold flex items-center gap-1"
                                title="Написать ученику"
                              >
                                <MessageSquare size={14} />
                                <span className="hidden lg:inline">Написать</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveStudentForModal(s);
                                  setParentAlertCustomNote(`Уважаемые родители! Ученик ${s.name} набрал ${score} из 140 на недавнем срезе по предмету "${selectedClass?.subject || 'ЕНТ'}". Рекомендуем уделить внимание выполнению домашних заданий.`);
                                  setIsParentAlertModalOpen(true);
                                }}
                                className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 transition-all text-xs font-bold flex items-center gap-1"
                                title="Связаться с родителями"
                              >
                                <Phone size={14} />
                                <span className="hidden lg:inline">Родителям</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Dispatched Assignments */}
          <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 border-2 border-surge-ink/10 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-bold text-surge-ink flex items-center gap-2">
                  <FileText className="text-teal-400" size={24} />
                  <span>Задания и Проверочные срезы класса</span>
                </h3>
                <p className="text-surge-ink/50 text-xs font-medium mt-1">
                  Тесты, квизы и темы, отправленные ученикам для подготовки к ЕНТ
                </p>
              </div>
              <button
                onClick={() => setIsCreateAssignmentModalOpen(true)}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-md text-xs transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Создать задание
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surge-ink/5 text-center text-surge-ink/40 text-sm">
                Вы еще не давали заданий этому классу. Нажмите «Создать задание», чтобы сгенерировать тест с помощью ИИ.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map(asg => {
                  const submissionsCount = Object.keys(asg.submissions || {}).length;
                  const totalStudents = selectedClass?.studentIds?.length || studentsInClass.length || 1;
                  return (
                    <div key={asg.id} className="p-6 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold uppercase mb-2">
                            {asg.type === 'test' ? 'Пробный ЕНТ' : asg.type === 'quiz' ? 'Квиз' : asg.type === 'flashcards' ? 'Карточки' : 'Тема'}
                          </span>
                          <h4 className="font-bold text-surge-ink text-base">{asg.title}</h4>
                          <p className="text-xs text-surge-ink/60 mt-1 line-clamp-2">{asg.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-surge-ink/50 pt-3 border-t border-surge-ink/5">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={12} /> Дедлайн: {asg.deadline || 'Без срока'}
                        </span>
                        <span className="font-bold text-teal-400">
                          Сдали: {submissionsCount} / {totalStudents}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </>
        )}

          {/* TEACHER TAB: PLANS */}
          {teacherTab === 'plans' && (
            <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 border-2 border-emerald-500/20 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase mb-2">
                    <Calendar size={14} /> Отдел планирования обучения ЕНТ
                  </div>
                  <h3 className="text-2xl font-bold text-surge-ink">Конструктор планов подготовки к ЕНТ</h3>
                  <p className="text-xs text-surge-ink/60 mt-1">
                    Сгенерируйте с помощью ИИ или настройте понедельный учебный план с темами, формулами и заданиями для класса {selectedClass?.name}
                  </p>
                </div>
                <button
                  onClick={handleGenerateAiPlan}
                  disabled={isGeneratingPlan}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 text-xs disabled:opacity-50 shrink-0"
                >
                  <Sparkles size={16} />
                  <span>{isGeneratingPlan ? 'Генерирую план...' : 'Сгенерировать план с ИИ'}</span>
                </button>
              </div>

              {/* Form settings */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-surge-ink/[0.02] border border-surge-ink/10">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-surge-ink/40 uppercase tracking-wider">Предмет ЕНТ</label>
                  <select
                    value={planSubject}
                    onChange={e => {
                      setPlanSubject(e.target.value);
                      handleLoadSubjectPreset(e.target.value);
                    }}
                    className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-2.5 text-xs text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="Математика">Математика (Профиль)</option>
                    <option value="Физика">Физика (Профиль)</option>
                    <option value="Химия">Химия (Профиль)</option>
                    <option value="Биология">Биология (Профиль)</option>
                    <option value="География">География (Профиль)</option>
                    <option value="Всемирная история">Всемирная история (Профиль)</option>
                    <option value="Основы права">Основы права / Құқық (Профиль)</option>
                    <option value="Английский язык">Английский язык / Иностранный (Профиль)</option>
                    <option value="Казахский язык и литература">Казахский язык и литература (Профиль)</option>
                    <option value="Русский язык и литература">Русский язык и литература (Профиль)</option>
                    <option value="Информатика">Информатика / IT (Профиль)</option>
                    <option value="История Казахстана">История Казахстана (Обязательный)</option>
                    <option value="Математическая грамотность">Математическая грамотность (Обязательный)</option>
                    <option value="Грамотность чтения">Грамотность чтения (Обязательный)</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-surge-ink/40 uppercase tracking-wider">Главная цель плана ЕНТ</label>
                  <input
                    type="text"
                    value={planGoal}
                    onChange={e => setPlanGoal(e.target.value)}
                    className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-2.5 text-xs text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="Например: Закрыть пробелы по химии/физике до 45 баллов"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-surge-ink/40 uppercase tracking-wider">Срок подготовки</label>
                  <select
                    value={planWeeksCount}
                    onChange={e => setPlanWeeksCount(Number(e.target.value))}
                    className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-2.5 text-xs text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value={2}>2 недели (Интенсив)</option>
                    <option value={4}>4 недели (1 месяц)</option>
                    <option value={8}>8 недель (2 месяца)</option>
                    <option value={12}>12 недель (Полный курс)</option>
                  </select>
                </div>
              </div>

              {/* Weeks List */}
              <div className="space-y-4">
                <h4 className="font-bold text-surge-ink text-sm flex items-center justify-between">
                  <span>Понедельная программа подготовки ({generatedPlanWeeks.length} нед.):</span>
                  <button
                    onClick={() => handleDispatchMaterial('plan', `ЕНТ План: ${planGoal}`, generatedPlanWeeks)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                  >
                    <Send size={14} /> Назначить этот план классу
                  </button>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedPlanWeeks.map((w, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs">
                          Неделя {w.week || idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-surge-ink/40">ЕНТ фокус</span>
                      </div>
                      <p className="font-bold text-surge-ink text-sm">{w.topic}</p>
                      <ul className="space-y-1.5 text-xs text-surge-ink/70">
                        {(w.tasks || []).map((t: string, tIdx: number) => (
                          <li key={tIdx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold shrink-0">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TEACHER TAB: FLASHCARDS */}
          {teacherTab === 'flashcards' && (
            <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 border-2 border-blue-500/20 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold text-xs uppercase mb-2">
                    <Layers size={14} /> Создание флеш-карточек ЕНТ
                  </div>
                  <h3 className="text-2xl font-bold text-surge-ink">Генератор формул, дат и терминов</h3>
                  <p className="text-xs text-surge-ink/60 mt-1">
                    Создайте набор карточек для быстрого запоминания формул ЕНТ и отправьте ученикам класса
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerateAiFlashcards}
                    disabled={isGeneratingCards}
                    className="px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 text-xs disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    <span>{isGeneratingCards ? 'Создаю...' : 'Сгенерировать с ИИ'}</span>
                  </button>
                  <button
                    onClick={() => handleDispatchMaterial('flashcards', `Карточки: ${fcTopic}`, generatedCards)}
                    className="px-5 py-3 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold rounded-2xl transition-all flex items-center gap-2 text-xs"
                  >
                    <Send size={16} />
                    <span>Отправить классу</span>
                  </button>
                </div>
              </div>

              {/* Topic Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-surge-ink/[0.02] border border-surge-ink/10">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-surge-ink/40 uppercase tracking-wider">Тема карточек</label>
                  <input
                    type="text"
                    value={fcTopic}
                    onChange={e => setFcTopic(e.target.value)}
                    className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-2.5 text-xs text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Например: Законы термодинамики или Ханы Казахского ханства"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-surge-ink/40 uppercase tracking-wider">Предмет ЕНТ</label>
                  <select
                    value={fcSubject}
                    onChange={e => setFcSubject(e.target.value)}
                    className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-2.5 text-xs text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="Математика">Математика (Профиль)</option>
                    <option value="Физика">Физика (Профиль)</option>
                    <option value="Химия">Химия (Профиль)</option>
                    <option value="Биология">Биология (Профиль)</option>
                    <option value="География">География (Профиль)</option>
                    <option value="Всемирная история">Всемирная история (Профиль)</option>
                    <option value="Основы права">Основы права / Құқық (Профиль)</option>
                    <option value="Английский язык">Английский язык / Иностранный (Профиль)</option>
                    <option value="Казахский язык и литература">Казахский язык и литература (Профиль)</option>
                    <option value="Русский язык и литература">Русский язык и литература (Профиль)</option>
                    <option value="Информатика">Информатика / IT (Профиль)</option>
                    <option value="История Казахстана">История Казахстана (Обязательный)</option>
                    <option value="Математическая грамотность">Математическая грамотность (Обязательный)</option>
                    <option value="Грамотность чтения">Грамотность чтения (Обязательный)</option>
                  </select>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedCards.map((c, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-4 hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between text-xs font-bold text-surge-ink/40">
                      <span>Карточка #{idx + 1}</span>
                      <span className="text-blue-400">Формула / Определение</span>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center font-bold text-surge-ink text-sm">
                      {c.front}
                    </div>
                    <div className="p-4 rounded-xl bg-surge-bg border border-surge-border text-center text-xs text-surge-ink/70">
                      {c.back}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEACHER TAB: QUIZZES */}
          {teacherTab === 'quizzes' && (
            <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 border-2 border-pink-500/20 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/10 text-pink-400 font-bold text-xs uppercase mb-2">
                    <HelpCircle size={14} /> Создание квизов ЕНТ
                  </div>
                  <h3 className="text-2xl font-bold text-surge-ink">Экспресс-квизы с таймером</h3>
                  <p className="text-xs text-surge-ink/60 mt-1">
                    Быстрые срезы знаний перед уроком для выявления отстающих учеников
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerateAiQuiz}
                    disabled={isGeneratingQuiz}
                    className="px-5 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2 text-xs disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    <span>{isGeneratingQuiz ? 'Составляю...' : 'Сгенерировать с ИИ'}</span>
                  </button>
                  <button
                    onClick={() => handleDispatchMaterial('quiz', `Квиз: ${quizTopic}`, generatedQuizList)}
                    className="px-5 py-3 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold rounded-2xl transition-all flex items-center gap-2 text-xs"
                  >
                    <Send size={16} />
                    <span>Отправить классу</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-surge-ink/[0.02] border border-surge-ink/10">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-surge-ink/40 uppercase tracking-wider">Тема экспресс-квиза</label>
                  <input
                    type="text"
                    value={quizTopic}
                    onChange={e => setQuizTopic(e.target.value)}
                    className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-2.5 text-xs text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="Например: Законы Ньютона и Силы"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-surge-ink/40 uppercase tracking-wider">Время на вопрос</label>
                  <select
                    value={quizTimerSec}
                    onChange={e => setQuizTimerSec(Number(e.target.value))}
                    className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-2.5 text-xs text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                  >
                    <option value={20}>20 секунд (Блиц)</option>
                    <option value={30}>30 секунд (Стандарт)</option>
                    <option value={60}>60 секунд (Расчетный)</option>
                  </select>
                </div>
              </div>

              {/* Questions Preview */}
              <div className="space-y-4">
                {generatedQuizList.map((q, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-3">
                    <p className="font-bold text-surge-ink text-sm">
                      <span className="text-pink-400 mr-2">Вопрос {idx + 1}:</span>
                      {q.question}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(q.options || []).map((opt: string, oIdx: number) => (
                        <div
                          key={oIdx}
                          className={cn(
                            "p-3 rounded-xl border text-xs font-medium",
                            oIdx === q.correctAnswerIndex ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" : "bg-surge-bg border-surge-border text-surge-ink/70"
                          )}
                        >
                          {opt} {oIdx === q.correctAnswerIndex && "✓ (Правильный)"}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-surge-ink/50 bg-surge-ink/5 p-3 rounded-xl">
                        💡 <strong>Разбор:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEACHER TAB: TESTS */}
          {teacherTab === 'tests' && (
            <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 border-2 border-rose-500/20 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-500 font-bold text-xs uppercase mb-2">
                    <FileText size={14} /> Создание тестов ЕНТ
                  </div>
                  <h3 className="text-2xl font-bold text-surge-ink">Генератор пробных срезов ЕНТ</h3>
                  <p className="text-xs text-surge-ink/60 mt-1">
                    Формируйте экзаменационные задания по формату Национального центра тестирования (НЦТ)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerateAiExamTest}
                    disabled={isGeneratingTest}
                    className="px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 text-xs disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    <span>{isGeneratingTest ? 'Составляю...' : 'Сгенерировать тест с ИИ'}</span>
                  </button>
                  <button
                    onClick={() => handleDispatchMaterial('test', `ЕНТ Тест: ${testTopic}`, generatedTestList.length > 0 ? generatedTestList : assignments[0]?.contentData)}
                    className="px-5 py-3 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold rounded-2xl transition-all flex items-center gap-2 text-xs"
                  >
                    <Send size={16} />
                    <span>Опубликовать тест</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-surge-ink/[0.02] border border-surge-ink/10">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-surge-ink/40 uppercase tracking-wider">Тема пробного среза</label>
                  <input
                    type="text"
                    value={testTopic}
                    onChange={e => setTestTopic(e.target.value)}
                    className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-2.5 text-xs text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    placeholder="Например: Законы Ньютона, термодинамика и оптика"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-surge-ink/40 uppercase tracking-wider">Предмет ЕНТ</label>
                  <select
                    value={testSubject}
                    onChange={e => setTestSubject(e.target.value)}
                    className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-2.5 text-xs text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  >
                    <option value="Математика">Математика (Профиль)</option>
                    <option value="Физика">Физика (Профиль)</option>
                    <option value="Химия">Химия (Профиль)</option>
                    <option value="Биология">Биология (Профиль)</option>
                    <option value="География">География (Профиль)</option>
                    <option value="Всемирная история">Всемирная история (Профиль)</option>
                    <option value="Основы права">Основы права / Құқық (Профиль)</option>
                    <option value="Английский язык">Английский язык / Иностранный (Профиль)</option>
                    <option value="Казахский язык и литература">Казахский язык и литература (Профиль)</option>
                    <option value="Русский язык и литература">Русский язык и литература (Профиль)</option>
                    <option value="Информатика">Информатика / IT (Профиль)</option>
                    <option value="История Казахстана">История Казахстана (Обязательный)</option>
                    <option value="Математическая грамотность">Математическая грамотность (Обязательный)</option>
                    <option value="Грамотность чтения">Грамотность чтения (Обязательный)</option>
                  </select>
                </div>
              </div>

              {/* Questions list */}
              <div className="space-y-4">
                {(generatedTestList.length > 0 ? generatedTestList : (assignments[0]?.contentData || [])).map((q: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-3">
                    <p className="font-bold text-surge-ink text-sm">
                      <span className="text-rose-500 font-mono font-bold mr-2">Задание {idx + 1}:</span>
                      {q.question}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(q.options || []).map((opt: string, oIdx: number) => (
                        <div
                          key={oIdx}
                          className={cn(
                            "p-3 rounded-xl border text-xs font-medium",
                            oIdx === q.correctAnswerIndex ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" : "bg-surge-bg border-surge-border text-surge-ink/70"
                          )}
                        >
                          {opt} {oIdx === q.correctAnswerIndex && "✓"}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-surge-ink/60 bg-surge-ink/5 p-3 rounded-xl">
                        💡 <strong>Пояснение решения:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEACHER TAB: COMMUNICATIONS (CHAT, VOICE, VIDEO) */}
          {teacherTab === 'communications' && (
            <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 border-2 border-surge-purple/20 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surge-purple/10 text-surge-purple font-bold text-xs uppercase mb-2">
                    <MessageCircle size={14} /> Центр коммуникаций учителя
                  </div>
                  <h3 className="text-2xl font-bold text-surge-ink">Чат, Голосовые заметки & Видеоразборы</h3>
                  <p className="text-xs text-surge-ink/60 mt-1">
                    Связывайтесь с учениками класса {selectedClass?.name}, мотивируйте отстающих и проводите видеоконсультации
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-surge-ink/5 p-1.5 rounded-2xl border border-surge-ink/10">
                  <button
                    onClick={() => setCommMode('chat')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                      commMode === 'chat' ? "bg-surge-purple text-white shadow-md" : "text-surge-ink/60 hover:text-surge-ink"
                    )}
                  >
                    <MessageSquare size={14} /> Чат
                  </button>
                  <button
                    onClick={() => setCommMode('voice')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                      commMode === 'voice' ? "bg-surge-purple text-white shadow-md" : "text-surge-ink/60 hover:text-surge-ink"
                    )}
                  >
                    <Mic size={14} /> Голосовой
                  </button>
                  <button
                    onClick={() => setCommMode('video')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                      commMode === 'video' ? "bg-surge-purple text-white shadow-md" : "text-surge-ink/60 hover:text-surge-ink"
                    )}
                  >
                    <Video size={14} /> Видеоразбор
                  </button>
                </div>
              </div>

              {/* Mode: TEXT CHAT */}
              {commMode === 'chat' && (
                <div className="space-y-4">
                  <div className="h-80 overflow-y-auto p-4 rounded-2xl bg-surge-ink/[0.02] border border-surge-ink/10 space-y-3">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-surge-ink/40">
                        Пока нет сообщений в чате класса. Напишите напутствие ученикам!
                      </div>
                    ) : (
                      messages.map(m => (
                        <div key={m.id} className="p-3.5 rounded-2xl bg-surge-card border border-surge-ink/10 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-surge-purple">{m.senderName}</span>
                            <span className="text-surge-ink/40">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-surge-ink">{m.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={e => setChatInputText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                      placeholder="Напишите сообщение классу или совет по ЕНТ..."
                      className="flex-1 bg-surge-bg border border-surge-border rounded-2xl px-5 py-3 text-xs text-surge-ink font-medium focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      className="px-6 py-3 bg-surge-purple hover:bg-surge-purple-dark text-white font-bold rounded-2xl text-xs shadow-lg shadow-surge-purple/20 flex items-center gap-2"
                    >
                      <Send size={14} /> Отправить
                    </button>
                  </div>
                </div>
              )}

              {/* Mode: VOICE CHAT */}
              {commMode === 'voice' && (
                <div className="p-8 rounded-3xl bg-surge-purple/5 border border-surge-purple/20 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-surge-purple/20 text-surge-purple flex items-center justify-center mx-auto text-3xl">
                    <Mic size={36} className={isRecordingVoice ? "animate-pulse text-rose-500" : ""} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-surge-ink">
                      {isRecordingVoice ? "Идет запись аудиосообщения..." : "Голосовое напутствие для учеников"}
                    </h4>
                    <p className="text-xs text-surge-ink/60 mt-1 max-w-md mx-auto">
                      Запишите голосовое объяснение решения задачи или слова поддержки для учеников перед ЕНТ
                    </p>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleToggleVoiceRecording}
                      className={cn(
                        "px-8 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg",
                        isRecordingVoice ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse" : "bg-surge-purple hover:bg-surge-purple-dark text-white shadow-surge-purple/25"
                      )}
                    >
                      {isRecordingVoice ? (
                        <>
                          <Square size={16} /> Остановить и отправить классу
                        </>
                      ) : (
                        <>
                          <Mic size={16} /> Начать запись голосового
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sent voice notes */}
                  <div className="pt-4 border-t border-surge-ink/10 text-left space-y-2">
                    <p className="text-xs font-bold text-surge-ink/50 uppercase tracking-wider">Отправленные голосовые:</p>
                    {messages.filter(m => m.type === 'voice_note').map(vm => (
                      <div key={vm.id} className="p-3 rounded-xl bg-surge-card border border-surge-ink/10 flex items-center justify-between text-xs">
                        <span className="font-bold text-surge-purple flex items-center gap-2">
                          <Volume2 size={16} /> {vm.content}
                        </span>
                        <span className="text-surge-ink/40">{new Date(vm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode: VIDEO SESSION ROOM */}
              {commMode === 'video' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Video Camera Window */}
                    <div className="relative aspect-video rounded-3xl bg-black/80 overflow-hidden border-2 border-surge-purple/30 flex items-center justify-center">
                      {isVideoSessionActive ? (
                        <video
                          ref={videoElementRef}
                          autoPlay
                          playsInline
                          muted
                          className={cn("w-full h-full object-cover", isVideoCameraOff && "hidden")}
                        />
                      ) : null}

                      {(!isVideoSessionActive || isVideoCameraOff) && (
                        <div className="text-center space-y-2">
                          <div className="w-16 h-16 rounded-full bg-surge-purple/20 text-surge-purple flex items-center justify-center mx-auto text-2xl font-bold">
                            👨‍🏫
                          </div>
                          <p className="text-xs text-white/70 font-bold">
                            {isVideoSessionActive ? "Камера отключена" : "Видеоразбор не запущен"}
                          </p>
                        </div>
                      )}

                      {/* Live Badge */}
                      {isVideoSessionActive && (
                        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-500 text-white font-bold text-[10px] uppercase flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-white" /> В ЭФИРЕ • ЕНТ РАЗБОР
                        </div>
                      )}

                      {/* Control Bar */}
                      {isVideoSessionActive && (
                        <div className="absolute bottom-4 inset-x-4 flex items-center justify-center gap-3 bg-black/60 backdrop-blur-md p-2 rounded-2xl">
                          <button
                            onClick={() => setIsVideoMuted(!isVideoMuted)}
                            className={cn("p-2.5 rounded-xl text-white transition-colors", isVideoMuted ? "bg-rose-500" : "bg-white/10 hover:bg-white/20")}
                          >
                            {isVideoMuted ? <MicOff size={16} /> : <Mic size={16} />}
                          </button>
                          <button
                            onClick={() => setIsVideoCameraOff(!isVideoCameraOff)}
                            className={cn("p-2.5 rounded-xl text-white transition-colors", isVideoCameraOff ? "bg-rose-500" : "bg-white/10 hover:bg-white/20")}
                          >
                            {isVideoCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
                          </button>
                          <button
                            onClick={handleToggleVideoSession}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
                          >
                            Завершить разбор
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Virtual Interactive Whiteboard */}
                    <div className="p-6 rounded-3xl bg-surge-ink/[0.02] border border-surge-ink/10 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Edit3 size={14} /> Интерактивная доска для формул
                          </span>
                          <span className="text-[10px] text-surge-ink/40">Видна ученикам</span>
                        </div>
                        <textarea
                          rows={6}
                          value={whiteboardText}
                          onChange={e => setWhiteboardText(e.target.value)}
                          className="w-full bg-surge-bg border border-surge-border rounded-2xl p-4 font-mono text-xs text-surge-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                          placeholder="Запишите формулы для разбора задачи..."
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-surge-ink/10">
                        <span className="text-xs text-surge-ink/50">Участников в звонке: {studentsInClass.length}</span>
                        {!isVideoSessionActive && (
                          <button
                            onClick={handleToggleVideoSession}
                            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/20 text-xs flex items-center gap-2"
                          >
                            <Video size={16} /> Запустить видео-сессию
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ================= STUDENT DASHBOARD ================= */
        <div className="space-y-8">
          {/* STUDENT TAB: OVERVIEW */}
          {studentTab === 'overview' && (
            <div className="space-y-8">
              {/* Student Class Info & Enrolled Teacher */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Target UNT Score Card */}
                <div className="bg-surge-card rounded-[2.5rem] p-8 border-2 border-amber-500/20 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 text-amber-500/5 pointer-events-none">
                    <Target size={140} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500">Текущий балл ЕНТ</span>
                    <button
                      onClick={() => {
                        setEditCurrentScore(user.currentEntScore || 108);
                        setEditTargetScore(user.targetEntScore || 130);
                        setEditProfileSub1(user.profileSubject1 || 'Физика');
                        setEditProfileSub2(user.profileSubject2 || 'Математика (Профиль)');
                        setEditHistoryScore(user.subjectScores?.history || 18);
                        setEditMathLitScore(user.subjectScores?.mathLit || 8);
                        setEditReadingLitScore(user.subjectScores?.readingLit || 8);
                        setEditProfile1Score(user.subjectScores?.profile1 || 37);
                        setEditProfile2Score(user.subjectScores?.profile2 || 37);
                        setIsEditEntModalOpen(true);
                      }}
                      className="p-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 transition-all flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Edit3 size={13} />
                      <span>Изменить</span>
                    </button>
                  </div>
                  <div>
                    <p className="text-4xl font-display font-black text-surge-ink">
                      {user.currentEntScore || 108} <span className="text-lg text-surge-ink/40 font-normal">/ 140</span>
                    </p>
                    <p className="text-xs text-surge-ink/50 mt-1">
                      Профили: <strong>{user.profileSubject1 || 'Физика'}</strong> & <strong>{user.profileSubject2 || 'Математика (Профиль)'}</strong>
                    </p>
                    <p className="text-xs text-surge-ink/50 mt-0.5">
                      Цель на Грант: <strong>{user.targetEntScore || 130} баллов</strong>
                    </p>
                  </div>
                  <div className="w-full bg-surge-ink/10 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.round(((user.currentEntScore || 108) / 140) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-amber-500">Шанс на Грант: 82%</span>
                    <span className="text-surge-ink/40">{Math.round(((user.currentEntScore || 108) / 140) * 100)}% от максимума</span>
                  </div>
                </div>

                {/* Teacher Connection Card */}
                <div className="md:col-span-2 bg-surge-card rounded-[2.5rem] p-8 border-2 border-teal-500/20 shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-teal-400">Ваш Преподаватель ЕНТ</span>
                      <h3 className="text-2xl font-bold text-surge-ink mt-1">
                        {selectedClass ? selectedClass.teacherName : 'Преподаватель не подключен'}
                      </h3>
                      <p className="text-xs text-surge-ink/50 mt-1">
                        {selectedClass 
                          ? `Класс: ${selectedClass.name} | Предмет: ${selectedClass.subject}`
                          : 'Введите код приглашения выше, чтобы подключиться к реальному классу вашего учителя'}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                      <GraduationCap size={24} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-surge-ink/10">
                    <div className="text-xs text-surge-ink/70">
                      Учитель отслеживает ваши пробные срезы и мотивирует перед ЕНТ.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStudentTab('communications')}
                        className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-teal-500/20"
                      >
                        <MessageSquare size={14} /> Связаться с учителем
                      </button>
                      <button
                        onClick={() => setIsJoinClassModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink font-bold text-xs transition-colors"
                      >
                        Вступить в класс по коду
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* UNT 5 Subjects Breakdown Radar */}
              <div className="bg-surge-card rounded-[2.5rem] p-8 border-2 border-surge-ink/10 shadow-xl space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-surge-ink flex items-center gap-2">
                    <BarChart3 className="text-teal-400" size={20} />
                    <span>Баллы по 5 предметам ЕНТ</span>
                  </h3>
                  <p className="text-xs text-surge-ink/50 mt-1">
                    Структура ваших баллов: 3 обязательных предмета + 2 профильных предмета (максимум 140 баллов)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="p-4 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-2">
                    <span className="text-[10px] font-bold text-teal-400 uppercase">Обязательный</span>
                    <p className="font-bold text-surge-ink text-xs truncate">История Казахстана</p>
                    <p className="text-2xl font-black text-surge-ink">16 <span className="text-xs text-surge-ink/40 font-normal">/ 20</span></p>
                    <div className="h-1.5 w-full bg-surge-ink/10 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400 rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-2">
                    <span className="text-[10px] font-bold text-teal-400 uppercase">Обязательный</span>
                    <p className="font-bold text-surge-ink text-xs truncate">Мат. грамотность</p>
                    <p className="text-2xl font-black text-surge-ink">9 <span className="text-xs text-surge-ink/40 font-normal">/ 10</span></p>
                    <div className="h-1.5 w-full bg-surge-ink/10 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400 rounded-full" style={{ width: '90%' }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-2">
                    <span className="text-[10px] font-bold text-teal-400 uppercase">Обязательный</span>
                    <p className="font-bold text-surge-ink text-xs truncate">Грамотность чтения</p>
                    <p className="text-2xl font-black text-surge-ink">10 <span className="text-xs text-surge-ink/40 font-normal">/ 10</span></p>
                    <div className="h-1.5 w-full bg-surge-ink/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-2">
                    <span className="text-[10px] font-bold text-surge-purple uppercase">Профиль 1</span>
                    <p className="font-bold text-surge-ink text-xs truncate">Физика</p>
                    <p className="text-2xl font-black text-surge-ink">38 <span className="text-xs text-surge-ink/40 font-normal">/ 50</span></p>
                    <div className="h-1.5 w-full bg-surge-ink/10 rounded-full overflow-hidden">
                      <div className="h-full bg-surge-purple rounded-full" style={{ width: '76%' }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-2">
                    <span className="text-[10px] font-bold text-surge-purple uppercase">Профиль 2</span>
                    <p className="font-bold text-surge-ink text-xs truncate">Математика</p>
                    <p className="text-2xl font-black text-surge-ink">35 <span className="text-xs text-surge-ink/40 font-normal">/ 50</span></p>
                    <div className="h-1.5 w-full bg-surge-ink/10 rounded-full overflow-hidden">
                      <div className="h-full bg-surge-purple rounded-full" style={{ width: '70%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STUDENT TAB: ASSIGNMENTS */}
          {studentTab === 'assignments' && (
            <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 border-2 border-surge-ink/10 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-display font-bold text-surge-ink flex items-center gap-2">
                    <FileText className="text-teal-400" size={24} />
                    <span>Задания от учителя к ЕНТ</span>
                  </h3>
                  <p className="text-surge-ink/50 text-xs font-medium mt-1">
                    Пробные срезы, квизы и упражнения, назначенные вашим преподавателем
                  </p>
                </div>
              </div>

              {assignments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-surge-ink/5 text-center text-surge-ink/40 text-sm">
                  Нет новых заданий. Ваш учитель скоро опубликует проверочный тест по ЕНТ!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignments.map(asg => {
                    const submission = asg.submissions?.[user.uid];
                    const isDone = Boolean(submission);
                    return (
                      <div key={asg.id} className="p-6 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold uppercase">
                              {asg.type === 'test' ? 'Пробный тест' : asg.type === 'quiz' ? 'Квиз' : asg.type === 'plan' ? 'План' : 'Карточки'}
                            </span>
                            {isDone ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                Сдано: {submission.score}%
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] font-bold">
                                Новое
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-surge-ink text-base">{asg.title}</h4>
                          <p className="text-xs text-surge-ink/60 mt-1">{asg.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-surge-ink/5">
                          <span className="text-xs text-surge-ink/40 font-medium">
                            Срок: {asg.deadline || 'В ближайшие дни'}
                          </span>
                          <button
                            onClick={() => {
                              setActiveAssignmentToSolve(asg);
                              setSolvingAnswers({});
                              setSolveSubmitted(false);
                            }}
                            className={cn(
                              "px-4 py-2 rounded-xl font-bold text-xs transition-all",
                              isDone 
                                ? "bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink" 
                                : "bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20"
                            )}
                          >
                            {isDone ? 'Пройти повторно' : 'Начать выполнение'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STUDENT TAB: QUESTS */}
          {studentTab === 'quests' && (
            <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 border-2 border-yellow-500/20 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-display font-bold text-surge-ink flex items-center gap-2">
                    <Flame className="text-yellow-500" size={24} />
                    <span>ЕНТ Квесты и Достижения</span>
                  </h3>
                  <p className="text-surge-ink/50 text-xs font-medium mt-1">
                    Выполняйте регулярные цели, зарабатывайте опыт и уверенно повышайте балл на ЕНТ
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3.5 py-1.5 rounded-full text-yellow-500 font-bold text-xs">
                  <Award size={14} /> +300 XP доступно
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quests.map(q => (
                  <div key={q.id} className="p-5 rounded-2xl bg-surge-ink/[0.02] border border-surge-ink/10 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-surge-ink text-sm flex items-center gap-2">
                          {q.completed ? <CheckCircle2 className="text-emerald-500" size={16} /> : <Target className="text-yellow-500" size={16} />}
                          <span>{q.title}</span>
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 text-[10px] font-black whitespace-nowrap">
                          +{q.xpReward} XP
                        </span>
                      </div>
                      <p className="text-xs text-surge-ink/60">{q.description}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-surge-ink/5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-surge-ink/40">
                          <span>Прогресс</span>
                          <span>{q.progress} / {q.maxProgress}</span>
                        </div>
                        <div className="h-1.5 w-full bg-surge-ink/10 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all", q.completed ? "bg-emerald-500" : "bg-yellow-500")}
                            style={{ width: `${Math.min(100, Math.round((q.progress / q.maxProgress) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-bold text-surge-ink/40 uppercase">
                          {q.category === 'tests' ? 'Тесты ЕНТ' : q.category === 'assignments' ? 'Задание учителя' : 'Учебный фокус'}
                        </span>
                        {q.completed ? (
                          q.claimed ? (
                            <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 size={13} /> Забрано
                            </span>
                          ) : (
                            <button
                              onClick={() => handleClaimQuest(q.id)}
                              className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-xl text-xs transition-transform active:scale-95 shadow-md flex items-center gap-1.5"
                            >
                              <Gift size={13} /> Забрать +{q.xpReward} XP
                            </button>
                          )
                        ) : (
                          <span className="text-surge-ink/40 text-xs font-medium">В процессе...</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACHIEVEMENTS SHOWCASE */}
              <div className="pt-6 border-t border-surge-ink/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-surge-ink flex items-center gap-2">
                      <Trophy className="text-amber-500" size={20} />
                      <span>Достижения и Медали ЕНТ 2026</span>
                    </h4>
                    <p className="text-xs text-surge-ink/50 mt-0.5">
                      Разблокируйте бейджи за систематическую подготовку и высокие баллы
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                    Разблокировано: 4 / 6
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { id: 'pioneer', name: 'Пионер ЕНТ', icon: '🎯', desc: 'Первый вход в систему', unlocked: true },
                    { id: 'first_100', name: 'Рубеж 100+', icon: '🏆', desc: 'Балл выше 100/140', unlocked: (user.currentEntScore || 108) >= 100 },
                    { id: 'math_titan', name: 'Титан Формул', icon: '📐', desc: '5 задач по профилю', unlocked: true },
                    { id: 'teacher_pet', name: 'Надежда Учителя', icon: '⭐', desc: 'Сдал задания вовремя', unlocked: true },
                    { id: 'fire_streak', name: 'Огненный Стрик', icon: '🔥', desc: '5 дней подготовки', unlocked: false },
                    { id: 'grant_holder', name: 'Грант в кармане', icon: '🎓', desc: '120+ баллов на срезе', unlocked: false }
                  ].map(ach => (
                    <div 
                      key={ach.id} 
                      className={cn(
                        "p-4 rounded-2xl border text-center space-y-2 transition-all",
                        ach.unlocked 
                          ? "bg-surge-ink/[0.04] border-amber-500/30 shadow-md shadow-amber-500/5" 
                          : "bg-surge-ink/[0.01] border-surge-ink/5 opacity-50 grayscale"
                      )}
                    >
                      <div className="text-3xl mx-auto">{ach.icon}</div>
                      <div>
                        <p className="font-bold text-surge-ink text-xs">{ach.name}</p>
                        <p className="text-[10px] text-surge-ink/50 mt-0.5">{ach.desc}</p>
                      </div>
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase",
                        ach.unlocked ? "bg-amber-500/10 text-amber-500" : "bg-surge-ink/10 text-surge-ink/40"
                      )}>
                        {ach.unlocked ? 'Получено' : 'Заблокировано'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* POINTS ACCRUAL & GRANT PREDICTOR */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-xl shrink-0">
                    💰
                  </div>
                  <div>
                    <h5 className="font-bold text-surge-ink text-sm">Ваш баланс ЕНТ: {user.xp || 2450} XP</h5>
                    <p className="text-xs text-surge-ink/60 mt-0.5">
                      За каждое выполненное задание учителя начисляются баллы, передающиеся в журнал успеваемости класса.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-xl border border-teal-500/20">
                    Уровень {user.level || 3} • {user.rank || 'Кандидат на Грант'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STUDENT TAB: COMMUNICATIONS */}
          {studentTab === 'communications' && (
            <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-10 border-2 border-indigo-500/20 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-surge-ink flex items-center gap-2">
                    <MessageSquare className="text-indigo-500" size={24} />
                    <span>Связь с преподавателем ЕНТ</span>
                  </h3>
                  <p className="text-xs text-surge-ink/60 mt-1">
                    Задайте вопрос учителю, прослушайте голосовые напутствия или подключитесь к видеоразбору
                  </p>
                </div>
                <button
                  onClick={handleToggleVideoSession}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Video size={16} />
                  <span>{isVideoSessionActive ? 'Покинуть видео-сессию' : 'Подключиться к видеоразбору'}</span>
                </button>
              </div>

              {/* Video Room if Active */}
              {isVideoSessionActive && (
                <div className="p-6 rounded-3xl bg-black/90 border border-surge-purple/30 space-y-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-teal-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      Видеоразбор задачи ЕНТ с учителем
                    </span>
                    <button
                      onClick={handleToggleVideoSession}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold"
                    >
                      Отключиться
                    </button>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs text-teal-300">
                    <p className="text-white/60 mb-1">Доска учителя:</p>
                    {whiteboardText}
                  </div>
                </div>
              )}

              {/* Messages list */}
              <div className="h-80 overflow-y-auto p-4 rounded-2xl bg-surge-ink/[0.02] border border-surge-ink/10 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-surge-ink/40">
                    Сообщений пока нет. Напишите вашему учителю вопрос по задаче!
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className="p-4 rounded-2xl bg-surge-card border border-surge-ink/10 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-400">{m.senderName}</span>
                        <span className="text-surge-ink/40">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-surge-ink font-medium">{m.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInputText}
                  onChange={e => setChatInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="Напишите вопрос учителю по сложному заданию..."
                  className="flex-1 bg-surge-bg border border-surge-border rounded-2xl px-5 py-3 text-xs text-surge-ink font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  onClick={handleSendChatMessage}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                  <Send size={14} /> Отправить
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Modal 1: Create Classroom (Teacher) */}
      <AnimatePresence>
        {isCreateClassModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surge-card border-2 border-teal-500/30 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative"
            >
              <button 
                onClick={() => setIsCreateClassModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-surge-ink/10 text-surge-ink/40 hover:text-surge-ink"
              >
                <X size={18} />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-surge-ink">Создать класс ЕНТ</h3>
                <p className="text-xs text-surge-ink/50 mt-1">
                  После создания вы получите уникальный код приглашения для учеников
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                    Название класса / Группы
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    placeholder="Например: 11 «А» — Физика и Математика"
                    className="w-full bg-surge-bg border border-surge-border rounded-2xl px-5 py-4 text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                    Предмет ЕНТ
                  </label>
                  <select
                    value={newClassSubject}
                    onChange={e => setNewClassSubject(e.target.value)}
                    className="w-full bg-surge-bg border border-surge-border rounded-2xl px-5 py-4 text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-sm"
                  >
                    <option value="Математика и Физика">Математика + Физика (Профиль)</option>
                    <option value="Химия и Биология">Химия + Биология (Профиль)</option>
                    <option value="География и Математика">География + Математика (Профиль)</option>
                    <option value="Информатика и Математика">Информатика + Математика (Профиль)</option>
                    <option value="Биология и География">Биология + География (Профиль)</option>
                    <option value="География и Английский язык">География + Английский язык (Профиль)</option>
                    <option value="Всемирная история и Основы права">Всемирная история + Основы права / Құқық (Профиль)</option>
                    <option value="Всемирная история и Английский язык">Всемирная история + Английский язык (Профиль)</option>
                    <option value="Всемирная история и География">Всемирная история + География (Профиль)</option>
                    <option value="Казахский язык и литература">Казахский язык + Казахская литература (Профиль)</option>
                    <option value="Русский язык и литература">Русский язык + Русская литература (Профиль)</option>
                    <option value="История Казахстана">История Казахстана (Обязательный)</option>
                    <option value="Математическая грамотность">Математическая грамотность (Обязательный)</option>
                    <option value="Грамотность чтения">Грамотность чтения (Обязательный)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreateClassModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink font-bold text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateClass}
                  disabled={isSubmitting || !newClassName.trim()}
                  className="flex-1 py-4 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-xl shadow-teal-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Создаем...' : 'Создать класс'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Join Classroom by Code (Student) */}
      <AnimatePresence>
        {isJoinClassModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surge-card border-2 border-teal-500/30 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative"
            >
              <button 
                onClick={() => setIsJoinClassModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-surge-ink/10 text-surge-ink/40 hover:text-surge-ink"
              >
                <X size={18} />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-surge-ink">Вступить в класс</h3>
                <p className="text-xs text-surge-ink/50 mt-1">
                  Введите код класса, полученный от вашего учителя ЕНТ
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                  Код класса (например ENT-8492)
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="ENT-XXXX"
                  className="w-full bg-surge-bg border border-surge-border rounded-2xl px-5 py-4 text-surge-ink font-mono font-black text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsJoinClassModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink font-bold text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleJoinClass}
                  disabled={isSubmitting || !joinCodeInput.trim()}
                  className="flex-1 py-4 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-xl shadow-teal-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Вступаем...' : 'Вступить'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Create Assignment (Teacher) */}
      <AnimatePresence>
        {isCreateAssignmentModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-surge-card border-2 border-teal-500/30 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative my-8"
            >
              <button 
                onClick={() => setIsCreateAssignmentModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-surge-ink/10 text-surge-ink/40 hover:text-surge-ink"
              >
                <X size={18} />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-surge-ink">Дать задание классу</h3>
                <p className="text-xs text-surge-ink/50 mt-1">
                  Сформируйте срез знаний ЕНТ вручную или сгенерируйте с помощью ИИ
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                    Тема задания
                  </label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={e => setAssignmentTitle(e.target.value)}
                    placeholder="Например: Законы термодинамики и теплоемкость"
                    className="w-full bg-surge-bg border border-surge-border rounded-2xl px-5 py-4 text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                      Формат
                    </label>
                    <select
                      value={assignmentType}
                      onChange={e => setAssignmentType(e.target.value as any)}
                      className="w-full bg-surge-bg border border-surge-border rounded-2xl px-4 py-3.5 text-surge-ink font-bold text-sm"
                    >
                      <option value="test">Пробный тест ЕНТ</option>
                      <option value="quiz">Квиз с таймером</option>
                      <option value="flashcards">Флеш-карточки</option>
                      <option value="task">Письменная задача</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                      Срок сдачи
                    </label>
                    <input
                      type="text"
                      value={assignmentDeadline}
                      onChange={e => setAssignmentDeadline(e.target.value)}
                      placeholder="через 2 дня"
                      className="w-full bg-surge-bg border border-surge-border rounded-2xl px-4 py-3.5 text-surge-ink font-bold text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                    Инструкции для учеников
                  </label>
                  <textarea
                    rows={2}
                    value={assignmentDesc}
                    onChange={e => setAssignmentDesc(e.target.value)}
                    placeholder="Например: Решите без калькулятора, время на тест — 15 минут."
                    className="w-full bg-surge-bg border border-surge-border rounded-2xl px-4 py-3 text-surge-ink text-sm resize-none"
                  />
                </div>

                {/* AI Question Generator Button */}
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between gap-4">
                  <div className="text-xs">
                    <p className="font-bold text-teal-400">Генератор вопросов ИИ</p>
                    <p className="text-surge-ink/60">
                      {generatedAiQuestions.length > 0 
                        ? `Сгенерировано: ${generatedAiQuestions.length} вопроса(ов) по ЕНТ` 
                        : 'Нажмите, чтобы ИИ составил тестовые задания по теме'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAiAssignment}
                    disabled={isGeneratingAiAssignment || !assignmentTitle.trim()}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    <Sparkles size={14} />
                    <span>{isGeneratingAiAssignment ? 'Создаю...' : 'Сгенерировать с ИИ'}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreateAssignmentModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink font-bold text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDispatchAssignment}
                  disabled={isSubmitting || !assignmentTitle.trim()}
                  className="flex-1 py-4 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-xl shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  <span>{isSubmitting ? 'Отправляем...' : 'Отправить классу'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 4: Direct Message to Student (Teacher) */}
      <AnimatePresence>
        {isMessageStudentModalOpen && activeStudentForModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surge-card border-2 border-surge-purple/30 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative"
            >
              <button 
                onClick={() => setIsMessageStudentModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-surge-ink/10 text-surge-ink/40 hover:text-surge-ink"
              >
                <X size={18} />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-surge-ink">Написать ученику</h3>
                <p className="text-xs text-surge-ink/50 mt-1">
                  Ученик: <strong>{activeStudentForModal.name}</strong> ({activeStudentForModal.email})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                  Сообщение / Совет по подготовке
                </label>
                <textarea
                  rows={4}
                  value={directMessageText}
                  onChange={e => setDirectMessageText(e.target.value)}
                  placeholder="Напишите слова поддержки или разбор темы..."
                  className="w-full bg-surge-bg border border-surge-border rounded-2xl px-4 py-3 text-surge-ink text-sm resize-none focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsMessageStudentModalOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink font-bold text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSendDirectMessage}
                  className="flex-1 py-3.5 rounded-2xl bg-surge-purple hover:bg-surge-purple-dark text-white font-bold text-sm shadow-xl shadow-surge-purple/20 flex items-center justify-center gap-2"
                >
                  <Send size={16} /> Отправить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 5: Parent Alert Modal (Teacher) */}
      <AnimatePresence>
        {isParentAlertModalOpen && activeStudentForModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surge-card border-2 border-rose-500/30 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative"
            >
              <button 
                onClick={() => setIsParentAlertModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-surge-ink/10 text-surge-ink/40 hover:text-surge-ink"
              >
                <X size={18} />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-rose-500 flex items-center gap-2">
                  <Phone size={22} /> Уведомление родителям
                </h3>
                <p className="text-xs text-surge-ink/50 mt-1">
                  Ученик: <strong>{activeStudentForModal.name}</strong> | Родитель: {activeStudentForModal.parentName || 'Контакты родителей'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-surge-ink/80 space-y-1">
                  <p className="font-bold text-rose-500">Телефон для связи:</p>
                  <p className="font-mono text-sm">{activeStudentForModal.parentContact || '+7 (777) 123-45-67'}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                    Текст уведомления / отчета
                  </label>
                  <textarea
                    rows={4}
                    value={parentAlertCustomNote}
                    onChange={e => setParentAlertCustomNote(e.target.value)}
                    className="w-full bg-surge-bg border border-surge-border rounded-2xl px-4 py-3 text-surge-ink text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(parentAlertCustomNote);
                    showToast("Текст скопирован для отправки в WhatsApp!", "success");
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Copy size={16} /> Скопировать
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(parentAlertCustomNote)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> В WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 6: Interactive Assignment Solver (Student) */}
      <AnimatePresence>
        {activeAssignmentToSolve && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-surge-card border-2 border-teal-500/30 rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-6 relative my-8"
            >
              <button 
                onClick={() => setActiveAssignmentToSolve(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-surge-ink/10 text-surge-ink/40 hover:text-surge-ink"
              >
                <X size={18} />
              </button>

              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Проверочный срез ЕНТ</span>
                <h3 className="text-2xl font-bold text-surge-ink mt-1">{activeAssignmentToSolve.title}</h3>
                <p className="text-xs text-surge-ink/50 mt-1">{activeAssignmentToSolve.description}</p>
              </div>

              {solveSubmitted ? (
                <div className="p-8 rounded-3xl bg-teal-500/10 border border-teal-500/30 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
                    <Trophy size={32} />
                  </div>
                  <h4 className="text-2xl font-bold text-surge-ink">Задание успешно сдано!</h4>
                  <p className="text-3xl font-mono font-black text-teal-400">{solveScore}%</p>
                  <p className="text-xs text-surge-ink/60 max-w-sm mx-auto">
                    Ваш результат сохранен и отправлен учителю ({activeAssignmentToSolve.teacherName}).
                  </p>
                  <button
                    onClick={() => setActiveAssignmentToSolve(null)}
                    className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl text-sm"
                  >
                    Вернуться к заданиям
                  </button>
                </div>
              ) : activeAssignmentToSolve.type === 'flashcards' ? (
                /* FLASHCARD DECK SOLVER */
                (() => {
                  const cards: any[] = Array.isArray(activeAssignmentToSolve.contentData) ? activeAssignmentToSolve.contentData : [];
                  const currentCard = cards[flashcardIdx] || { front: 'Формула', back: 'Определение' };
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between text-xs font-bold text-surge-ink/50">
                        <span>Карточка {flashcardIdx + 1} из {cards.length}</span>
                        <span className="text-teal-400">Изучено: {studiedCards.length} / {cards.length}</span>
                      </div>

                      {/* Flip card */}
                      <div 
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        className="min-h-[220px] p-8 rounded-3xl bg-surge-ink/[0.04] border-2 border-teal-500/30 flex flex-col items-center justify-center text-center cursor-pointer hover:border-teal-500 transition-all select-none group shadow-inner"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-3">
                          {isCardFlipped ? 'Определение / Ответ (Кликните для оборота)' : 'Термин / Формула (Кликните для ответа)'}
                        </span>
                        <p className="text-lg md:text-xl font-bold text-surge-ink max-w-md">
                          {isCardFlipped ? currentCard.back : currentCard.front}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCardFlipped(false);
                            setFlashcardIdx(prev => Math.max(0, prev - 1));
                          }}
                          disabled={flashcardIdx === 0}
                          className="px-5 py-3 rounded-2xl bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold text-xs disabled:opacity-40"
                        >
                          ← Назад
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!studiedCards.includes(flashcardIdx)) {
                              setStudiedCards([...studiedCards, flashcardIdx]);
                            }
                            setIsCardFlipped(false);
                            if (flashcardIdx < cards.length - 1) {
                              setFlashcardIdx(prev => prev + 1);
                            }
                          }}
                          className="px-6 py-3 rounded-2xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 font-bold text-xs"
                        >
                          ✓ Знаю эту формулу
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCardFlipped(false);
                            setFlashcardIdx(prev => Math.min(cards.length - 1, prev + 1));
                          }}
                          disabled={flashcardIdx === cards.length - 1}
                          className="px-5 py-3 rounded-2xl bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold text-xs disabled:opacity-40"
                        >
                          Вперед →
                        </button>
                      </div>

                      <div className="pt-4 border-t border-surge-ink/10 flex gap-3">
                        <button
                          onClick={() => setActiveAssignmentToSolve(null)}
                          className="flex-1 py-3.5 rounded-2xl bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink font-bold text-sm"
                        >
                          Закрыть
                        </button>
                        <button
                          onClick={handleSubmitSolving}
                          className="flex-1 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-xl shadow-teal-500/20"
                        >
                          Завершить изучение (+50 XP)
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : activeAssignmentToSolve.type === 'plan' ? (
                /* STUDY PLAN ROADMAP SOLVER */
                (() => {
                  const weeks: any[] = Array.isArray(activeAssignmentToSolve.contentData) ? activeAssignmentToSolve.contentData : [];
                  return (
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                      <p className="text-xs text-surge-ink/60">
                        Ознакомьтесь с программой обучения и отмечайте выполненные темы:
                      </p>
                      <div className="space-y-4">
                        {weeks.map((w, wIdx) => (
                          <div key={wIdx} className="p-5 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs">
                                Неделя {w.week || wIdx + 1}
                              </span>
                              <span className="font-bold text-surge-ink text-sm">{w.topic}</span>
                            </div>
                            <ul className="space-y-2">
                              {(w.tasks || []).map((t: string, tIdx: number) => {
                                const key = `${wIdx}_${tIdx}`;
                                const isChecked = Boolean(checkedPlanTasks[key]);
                                return (
                                  <li 
                                    key={tIdx}
                                    onClick={() => setCheckedPlanTasks({ ...checkedPlanTasks, [key]: !isChecked })}
                                    className="flex items-center gap-2 text-xs text-surge-ink/80 cursor-pointer p-2 rounded-xl hover:bg-surge-ink/5 transition-all"
                                  >
                                    <div className={cn(
                                      "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                                      isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-surge-ink/30"
                                    )}>
                                      {isChecked && <Check size={12} />}
                                    </div>
                                    <span className={isChecked ? "line-through opacity-60" : ""}>{t}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-surge-ink/10 flex gap-3">
                        <button
                          onClick={() => setActiveAssignmentToSolve(null)}
                          className="flex-1 py-3.5 rounded-2xl bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink font-bold text-sm"
                        >
                          Отложить
                        </button>
                        <button
                          onClick={handleSubmitSolving}
                          className="flex-1 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-xl shadow-teal-500/20"
                        >
                          Принять план (+50 XP)
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* QUIZ / TEST SOLVER */
                <div className="space-y-6">
                  {((activeAssignmentToSolve.contentData as QuizQuestion[]) || []).map((q, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-surge-ink/[0.03] border border-surge-ink/10 space-y-3">
                      <p className="font-bold text-surge-ink text-sm">
                        <span className="text-teal-400 mr-2">{idx + 1}.</span>
                        {q.question}
                      </p>
                      <div className="space-y-2">
                        {(q.options || ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D']).map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => setSolvingAnswers({ ...solvingAnswers, [idx]: optIdx })}
                            className={cn(
                              "w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between",
                              solvingAnswers[idx] === optIdx
                                ? "bg-teal-500/15 border-teal-500 text-teal-400 font-bold"
                                : "bg-surge-bg border-surge-border text-surge-ink/80 hover:border-teal-500/40"
                            )}
                          >
                            <span>{opt}</span>
                            {solvingAnswers[idx] === optIdx && <CheckCircle2 size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setActiveAssignmentToSolve(null)}
                      className="flex-1 py-4 rounded-2xl bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink font-bold text-sm"
                    >
                      Отложить
                    </button>
                    <button
                      onClick={handleSubmitSolving}
                      disabled={Object.keys(solvingAnswers).length === 0}
                      className="flex-1 py-4 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-xl shadow-teal-500/20 disabled:opacity-50"
                    >
                      Завершить и сдать учителю
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 7: Add Student Manually (Teacher) */}
      <AnimatePresence>
        {isAddStudentModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surge-card border-2 border-teal-500/30 rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-6 relative"
            >
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-surge-ink/10 text-surge-ink/40 hover:text-surge-ink"
              >
                <X size={18} />
              </button>

              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Журнал класса</span>
                <h3 className="text-2xl font-bold text-surge-ink mt-1">Добавить ученика в класс</h3>
                <p className="text-xs text-surge-ink/50 mt-1">
                  Ученик появится в вашем списке контроля успеваемости ЕНТ
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                    ФИО ученика
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentForm.name}
                    onChange={e => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    placeholder="Например: Касымов Нурлан Серикович"
                    className="w-full bg-surge-bg border border-surge-border rounded-2xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                      Текущий балл ЕНТ
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={140}
                      value={newStudentForm.currentScore}
                      onChange={e => setNewStudentForm({ ...newStudentForm, currentScore: Number(e.target.value) })}
                      className="w-full bg-surge-bg border border-surge-border rounded-2xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                      Цель на Грант (140)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={140}
                      value={newStudentForm.targetScore}
                      onChange={e => setNewStudentForm({ ...newStudentForm, targetScore: Number(e.target.value) })}
                      className="w-full bg-surge-bg border border-surge-border rounded-2xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                    Имя родителя / Законного представителя
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.parentName}
                    onChange={e => setNewStudentForm({ ...newStudentForm, parentName: e.target.value })}
                    placeholder="Например: Алия Сериковна (Мама)"
                    className="w-full bg-surge-bg border border-surge-border rounded-2xl px-4 py-3 text-surge-ink text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-1.5 ml-1">
                    Телефон / WhatsApp родителей
                  </label>
                  <input
                    type="tel"
                    value={newStudentForm.parentContact}
                    onChange={e => setNewStudentForm({ ...newStudentForm, parentContact: e.target.value })}
                    placeholder="+7 (701) 234-56-78"
                    className="w-full bg-surge-bg border border-surge-border rounded-2xl px-4 py-3 text-surge-ink text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold text-sm"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleAddStudentToClass}
                  className="flex-1 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-xl shadow-teal-500/20"
                >
                  Добавить в класс
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 8: Edit ENT Scores & Profiles */}
      <AnimatePresence>
        {isEditEntModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surge-card rounded-[2.5rem] p-8 max-w-xl w-full border border-amber-500/30 shadow-2xl space-y-6 text-surge-ink text-left my-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-black text-surge-ink">Редактирование баллов ЕНТ</h3>
                    <p className="text-xs text-surge-ink/50 mt-0.5">Измените ваши профильные предметы и баллы по 5 предметам</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditEntModalOpen(false)}
                  className="p-2 text-surge-ink/30 hover:text-surge-ink bg-surge-ink/5 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-surge-ink/50 mb-2">Целевой балл (Грант)</label>
                    <input 
                      type="number"
                      min="50"
                      max="140"
                      value={editTargetScore}
                      onChange={e => setEditTargetScore(Number(e.target.value))}
                      className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-amber-500 mb-2">Общий балл (авто-расчет)</label>
                    <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-600 font-black text-lg">
                      {Number(editHistoryScore) + Number(editMathLitScore) + Number(editReadingLitScore) + Number(editProfile1Score) + Number(editProfile2Score)} / 140
                    </div>
                  </div>
                </div>

                <div className="border-t border-surge-border pt-4 space-y-4">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Профильные предметы ЕНТ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-surge-ink/50 uppercase tracking-wider mb-1.5">Профильный предмет 1 (макс. 50)</label>
                      <select
                        value={editProfileSub1}
                        onChange={e => setEditProfileSub1(e.target.value)}
                        className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      >
                        {['Физика', 'Математика (Профиль)', 'Химия', 'Биология', 'География', 'Всемирная история', 'Основы права (Құқық)', 'Английский язык', 'Информатика', 'Казахская литература'].map(s => (
                          <option key={s} value={s} className="bg-surge-bg text-surge-ink">{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-surge-ink/50 uppercase tracking-wider mb-1.5">Профильный предмет 2 (макс. 50)</label>
                      <select
                        value={editProfileSub2}
                        onChange={e => setEditProfileSub2(e.target.value)}
                        className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      >
                        {['Математика (Профиль)', 'Физика', 'Химия', 'Биология', 'География', 'Всемирная история', 'Основы права (Құқық)', 'Английский язык', 'Информатика', 'Казахская литература'].map(s => (
                          <option key={s} value={s} className="bg-surge-bg text-surge-ink">{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-surge-border pt-4 space-y-4">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Баллы по 5 предметам ЕНТ</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-surge-ink/5 rounded-xl">
                      <span className="text-sm font-bold text-surge-ink">История Казахстана (макс. 20)</span>
                      <input 
                        type="number"
                        min="0"
                        max="20"
                        value={editHistoryScore}
                        onChange={e => setEditHistoryScore(Math.min(20, Math.max(0, Number(e.target.value))))}
                        className="w-20 bg-surge-bg border border-surge-border rounded-lg px-3 py-1.5 text-center font-bold text-surge-ink"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surge-ink/5 rounded-xl">
                      <span className="text-sm font-bold text-surge-ink">Математическая грамотность (макс. 10)</span>
                      <input 
                        type="number"
                        min="0"
                        max="10"
                        value={editMathLitScore}
                        onChange={e => setEditMathLitScore(Math.min(10, Math.max(0, Number(e.target.value))))}
                        className="w-20 bg-surge-bg border border-surge-border rounded-lg px-3 py-1.5 text-center font-bold text-surge-ink"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surge-ink/5 rounded-xl">
                      <span className="text-sm font-bold text-surge-ink">Грамотность чтения (макс. 10)</span>
                      <input 
                        type="number"
                        min="0"
                        max="10"
                        value={editReadingLitScore}
                        onChange={e => setEditReadingLitScore(Math.min(10, Math.max(0, Number(e.target.value))))}
                        className="w-20 bg-surge-bg border border-surge-border rounded-lg px-3 py-1.5 text-center font-bold text-surge-ink"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surge-ink/5 rounded-xl">
                      <span className="text-sm font-bold text-surge-ink">Профильный 1: {editProfileSub1} (макс. 50)</span>
                      <input 
                        type="number"
                        min="0"
                        max="50"
                        value={editProfile1Score}
                        onChange={e => setEditProfile1Score(Math.min(50, Math.max(0, Number(e.target.value))))}
                        className="w-20 bg-surge-bg border border-surge-border rounded-lg px-3 py-1.5 text-center font-bold text-surge-ink"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surge-ink/5 rounded-xl">
                      <span className="text-sm font-bold text-surge-ink">Профильный 2: {editProfileSub2} (макс. 50)</span>
                      <input 
                        type="number"
                        min="0"
                        max="50"
                        value={editProfile2Score}
                        onChange={e => setEditProfile2Score(Math.min(50, Math.max(0, Number(e.target.value))))}
                        className="w-20 bg-surge-bg border border-surge-border rounded-lg px-3 py-1.5 text-center font-bold text-surge-ink"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setIsEditEntModalOpen(false)}
                  className="flex-1 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold py-4 rounded-xl transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    const totalScore = Number(editHistoryScore) + Number(editMathLitScore) + Number(editReadingLitScore) + Number(editProfile1Score) + Number(editProfile2Score);
                    onUpdateUser({
                      currentEntScore: totalScore,
                      targetEntScore: Number(editTargetScore),
                      profileSubject1: editProfileSub1,
                      profileSubject2: editProfileSub2,
                      subjectScores: {
                        history: Number(editHistoryScore),
                        mathLit: Number(editMathLitScore),
                        readingLit: Number(editReadingLitScore),
                        profile1: Number(editProfile1Score),
                        profile2: Number(editProfile2Score)
                      }
                    });
                    showToast('Баллы ЕНТ и профильные предметы успешно обновлены!', 'success');
                    setIsEditEntModalOpen(false);
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                >
                  Сохранить изменения
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
