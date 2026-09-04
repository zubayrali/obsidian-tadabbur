import type { Strings } from "./en";

/** Complete Arabic interface. Kept as Partial so future English keys still
 * degrade safely until translated. */
export const ar: Partial<Strings> = {
	pluginName: "تدبّر",
	noticeNoFalah: (url: string) =>
		"يتطلب تدبّر إضافة فلاح، فهي توفر نص القرآن والقارئ، ولا يعمل تدبّر منفردًا. " +
		`ثبّت فلاح وفعّله أولًا، ثم فعّل تدبّر.\n\n${url}`,
	cmdCreateReflectionsBase: "إنشاء قاعدة التدبرات",
	noticeNeedsFalahApi: (version: number) =>
		`يحتاج تدبّر إلى واجهة إضافة فلاح بالإصدار ${version} أو أحدث. فلاح مفعّل لكنه لم يوفر هذا الإصدار؛ حدّث فلاح ثم أعد التحميل.`,

	setHeadingReflections: "التدبرات",
	setDestinationName: "حفظ التدبرات في",
	setDestinationDesc: "المكان الذي يُكتب فيه التدبر. يتيح «السؤال في كل مرة» اختيار الوجهة في نافذة الكتابة.",
	optionDestinationAsk: "السؤال في كل مرة",
	optionDestinationPerAyah: "ملاحظة خاصة بالآية",
	optionDestinationDaily: "ملاحظة اليوم",
	setDefaultScaffoldName: "القالب الافتراضي للتدبر",
	setDefaultScaffoldDesc: "البنية التي تبدأ بها نافذة الكتابة. يمكنك تغييرها لكل تدبر.",
	setPerAyahFolderName: "مجلد ملاحظات الآيات",
	settingsExampleFolder: (path: string) => `مثال: ${path}`,
	setDailyNoteHeadingName: "عنوان قسم الملاحظة اليومية",
	settingsAppendedUnder: (heading: string, path: string) => `يُضاف تحت «## ${heading}» في ${path}`,
	settingsSeededFromTemplate: (template: string) => `تبدأ الملاحظات اليومية الجديدة من القالب: ${template}`,
	settingsDailyNotesOffWarning:
		"إضافة الملاحظات اليومية الأساسية غير مفعّلة، لذلك لا يوجد مجلد أو تنسيق يُتّبع وستُحفظ التدبرات في جذر الخزنة. فعّل الملاحظات اليومية للتحكم في ذلك.",

	scaffoldNameThreeLine: "ثلاثة أسطر (ملخص / معنى / عمل)",
	scaffoldNameThreeLens: "ثلاث زوايا (محاسبة / امتنان / دعاء)",
	fieldSummary: "ملخص",
	fieldMeansToMe: "ما الذي تعنيه لي",
	fieldOneAction: "عمل واحد",
	fieldSelfExamination: "محاسبة النفس",
	fieldGratitudeOrAction: "امتنان أو عمل",
	fieldDua: "دعاء",

	captureHeading: (surah: number, ayah: number) => `تدبّر في ${surah}:${ayah}`,
	setScaffoldName: "القالب",
	setThemesName: "الموضوعات",
	setThemesDesc: "اختيارية ومفصولة بفواصل",
	placeholderThemes: "التوحيد، التوكل",
	setSaveToName: "الحفظ في",
	optionSaveToPerAyah: "ملاحظة خاصة بالآية",
	optionSaveToDaily: "ملاحظة اليوم",
	buttonSaveReflection: "حفظ التدبر",
	noticeReflectionSaved: "تم حفظ التدبر",
	noticeSaveReflectionFailed: (reason: string) => `تعذر حفظ التدبر: ${reason}`,

	actionReflectOnThisVerse: "تدبّر في هذه الآية",
	slashReflectLabel: "تدبّر في آية",
	noticeNoVerseText: (surah: number, ayah: number) =>
		`تعذر تحميل ${surah}:${ayah}. ثبّت بيانات القرآن أو تحقق من اتصالك.`,

	stripGroupLabel: (label: string, count: number) => `${label} (${count})`,
	stripReflectionsLabel: "تدبرات",
	stripMentionsLabel: "إشارات",
	stripConnectedLabel: "مرتبطة:",

	noticeBaseAlreadyExists: "قاعدة Reflections.base موجودة بالفعل",
	noticeBaseCreated: "تم إنشاء Reflections.base",

	noteHeadingEmpty: (def: string) => `لا يمكن تركه فارغًا؛ سيُستخدم «${def}».`,
	noteHeadingStripped: (value: string) => `اكتب النص دون علامة «#»؛ سيُستخدم «${value}».`,
	noteFolderEmpty: (def: string) => `لا يمكن تركه فارغًا؛ سيُستخدم «${def}».`,
	noteFolderDroppedMd: "هذا مجلد وليس ملاحظة؛ أُزيل الامتداد «.md».",
};
