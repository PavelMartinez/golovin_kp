import {useState} from 'react'
import {SubmitHandler, useForm} from "react-hook-form";

enum AnswerCorrect {
    TRUE = "TRUE",
    PARTIALLY_TRUE = "PARTIALLY_TRUE",
    PARTIALLY_FALSE = "PARTIALLY_FALSE",
    FALSE = "FALSE"
}

type AnswerType = {
    text: string;
    weight: number;
    correct: AnswerCorrect;
    checked?: boolean;
    groupId?: string; // Новое поле для группировки
}


const Coefficients = {
    [AnswerCorrect.TRUE]: 1,
    [AnswerCorrect.PARTIALLY_TRUE]: 0.5,
    [AnswerCorrect.PARTIALLY_FALSE]: -0.5,
    [AnswerCorrect.FALSE]: -1
}

const hasIncompatibleAnswers = (questions: AnswerType[]) => {
    const groupMap: Record<string, AnswerType[]> = {};

    // Группируем ответы по groupId
    questions.forEach((question) => {
        if (question.checked && question.groupId) {
            if (!groupMap[question.groupId]) {
                groupMap[question.groupId] = [];
            }
            groupMap[question.groupId].push(question);
        }
    });

    // Проверяем, есть ли в группе более одного выбранного ответа
    for (const groupId in groupMap) {
        if (groupMap[groupId].length > 1) {
            return true; // Найдены несовместимые ответы
        }
    }

    return false; // Несовместимых ответов нет
};

function App() {
    const [questions, setQuestions] = useState<AnswerType[]>([]);
    const {
        register,
        handleSubmit,
        reset
    } = useForm<AnswerType>();
    const checkedQuestions = questions.filter((item) => !!item.checked)

    const weightSumPositive = hasIncompatibleAnswers(checkedQuestions)
        ? 0
        : checkedQuestions.filter((item) => item.correct === AnswerCorrect.TRUE || item.correct === AnswerCorrect.PARTIALLY_TRUE).reduce((acc: number, item) => {
            acc += item.weight;
            return acc;
        }, 0);

    const weightSumNegative = hasIncompatibleAnswers(checkedQuestions)
        ? 0
        : checkedQuestions.filter((item) => item.correct === AnswerCorrect.FALSE || item.correct === AnswerCorrect.PARTIALLY_FALSE).reduce((acc: number, item) => {
            acc += item.weight;
            return acc;
        }, 0);
    const weightSumPositiveNormed = weightSumPositive > 1 ? 1 - (weightSumPositive - 1) / 2 : weightSumPositive;
    const weightSum = weightSumPositiveNormed + weightSumNegative;


    const onSubmit: SubmitHandler<AnswerType> = (data) => {
        const newQuestions = [...questions, { text: data.text, weight: 0, correct: data.correct, groupId: data.groupId }];
        setQuestions(newQuestions.map((question) => {
            const countThisType = newQuestions.filter((item) => item.correct === question.correct)

            return {
                ...question,
                weight: Coefficients[question.correct] / countThisType.length
            }
        }));
        reset();
    }

    return (
        <div className={"container flex items-center p-4 h-screen flex-col gap-4"}>
            <div className="flex flex-row">
                <div className={"text-white"}>
                    <form onSubmit={handleSubmit(onSubmit)} className={"flex flex-col gap-2"}>
                        <input {...register("text")}
                               required={true}
                               placeholder={"текст ответа"}
                               className={"rounded-2xl outline-0 border border-black text-black p-1"}
                        />
                        <select {...register("correct")} className={"bg-white text-black s"}>
                            {Object.values(AnswerCorrect).map((item, index) => (
                                <option key={index} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                        <input
                            {...register("groupId")}
                            placeholder="ID группы (опционально)"
                            className={"rounded-2xl outline-0 border border-black text-black p-1"}
                        />
                        {/*<Slider*/}
                        {/*    defaultValue={[0.5]}*/}
                        {/*    max={1}*/}
                        {/*    name={"weight"}*/}
                        {/*    step={0.1}*/}
                        {/*    className={cn("w-[60%]", "p-4 w-full")}*/}
                        {/*/>*/}
                        <button type={"submit"} className={"bg-black text-white rounded-2xl p-1"}>
                            Добавить ответ
                        </button>
                    </form>
                </div>
                <div className={"flex-auto"}>

                </div>
            </div>
            <div className={"w-full flex flex-row gap-10"}>
                <pre
                    className="bg-gray-100 p-4 rounded-md text-sm font-mono dark:bg-gray-800 dark:text-gray-200 overflow-auto"
                >
                    {JSON.stringify(questions, null, 4)}
                </pre>
                <ul>
                    <li>
                        {questions.map((item, index) => (
                            <div className={"flex flex-row gap-2 items-center"}>
                                <input type={"checkbox"} key={index} checked={item.checked} onClick={() => {
                                    // 1. Make a shallow copy of the items
                                    const items = [...questions];
                                    // 2. Make a shallow copy of the item you want to mutate
                                    const item = {...items[index]};
                                    // 3. Replace the property you're intested in
                                    item.checked = !item.checked;
                                    // 4. Put it back into our array. N.B. we *are* mutating the array here,
                                    //    but that's why we made a copy first
                                    items[index] = item;
                                    // 5. Set the state to our new copy
                                    setQuestions(items);
                                }} />
                                <label>{item.text}</label>
                            </div>
                        ))}
                    </li>
                </ul>
                <div className={"flex flex-col gap-2"}>
                    <span>Сумма верных {weightSumPositiveNormed}</span>
                    <span>Сумма неверных {weightSumNegative}</span>
                    <span>Сумма {weightSum}</span>
                </div>
            </div>
        </div>
    )
}

export default App
