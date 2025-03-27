import { GlobalUtils, Converter, EBaseLogLevel } from "./../../utils";
import { Service } from "./../../platform/core";
import { IInvocation } from "../../platform/model";
import { SimpleCalllists } from "../classes";
import { ISimpleCalllists } from "../model";
import { EUpdateKind, IBaseEntity, IDataUpdateParams } from "../../base/model";
import { DataFactory } from "../../data/model";


class MainService extends Service {
    constructor() {
        super("zetta.MainService");

        // onCreateCode

        // 2. На время разработки дублируем в консоль все, 
        // что пишется в лог до уровня debug
        // Настравается в приложении "Админ платформы" (поиск по имени пакета)
        // по возрастанию степени детализаии:
        // core
        // error
        // warning
        // info
        // trace
        // debug
        this.log.consoleLevel = EBaseLogLevel.debug;


        // Классы ТОЛЬКО для отслеживания изменения и добавления новых записей
        // (списки loadAll через них не получаем)
        this._simpleCalllists = new SimpleCalllists(this.context);
        this._simpleCalllists.onAfterUpdate(this.afterUpdateSimpleCalllists.bind(this));


        this.load();
    }

    private _simpleCalllists: ISimpleCalllists;  // Список для обзвона

    async onInit() {
        await super.onInit();
        try {

            // onInitCode

            // 1. Вывод сообщения о запуске
            const message_init: string = '### zetta.MainServise.ts -> onInit';
            //console.log(message_init);          
            this.log.info(message_init);

        }
        catch (e) {
            this.log.exception("onInit", e);
        }
    }


    async onTimer() {
        await super.onTimer();
        try {

            // onTimerCode

        }
        catch (e) {
            this.log.exception("onTimer", e);
        }
    }



    /**
    * Обработчик обновления списка обзвона
    */
    async afterUpdateSimpleCalllists(params_: IDataUpdateParams<IBaseEntity>) {
        //this.log.debug('afterUpdateSimpleCalllists -> params_:\n', params_);

        // Ранний выход, если событие не является обновлением
        if (params_.updateKind !== EUpdateKind.Modify) return;

        try {
            // Параметры
            const { id: entityId, oldData = {}, newData = {} } = params_;
            const oldTryCount = oldData.tryCount ?? 0;
            const newTryCount = newData.tryCount ?? 0;

            this.log.debug('Calllist counters:', { entityId, oldTryCount, newTryCount });

            // Проверка условия для переноса на следующий день
            const attemptNmber = 2;
            if (this.isAttemptNumber(attemptNmber, newTryCount, oldTryCount)) {
                await this.moveCallToNextDay(entityId);
            }


            /*
            // Данные сессии
            const session = DataFactory.sessionInfo;
            //this.log.debug('sessionInfo: ', session);

            // Ключа integration_point_id нет в явном виде,
            // получаем значение через приведение к JSON
            const integrationPointId = JSON.parse(JSON.stringify(session)).integration_point_id;
            //this.log.debug('#integrationPointId: ', integrationPointId);
            */

            //if (modifierId !== integrationPointId) {
            //this.log.debug('afterUpdateRecommendedBls, params_:\n', params_);
            //} // if (modifierId !==

        }
        catch (e) {
            this.log.exception('afterUpdateBlacklists', e);
        }
    }


    //Поцедура -> для вызова из сценария
    // Что-то пошло не так
    // В процедуру запрос прилетал, нонабора номера не было
    async check_exec(invocation_: IInvocation) {
        this.log.debug('check_exec -> invocation_', invocation_);

        /*
        check_exec -> invocation_
        {
            "id": "b6189178-ff60-4e54-b1ae-46e5523e71b0",
            "timestamp": 1742911629914,
            "timeToLive": 600,
            "from": "callcenter.OutboundService",
            "to": "zetta.MainService",
            "method": "check_exec",
            "request": "ТЕСТ набор номера"
        }
        */

        return true;

        /*
        try {
            ...
        }
        catch (e) {
            ...
        }
        */
    }


    // declarationsCode

    // functionsCode


    /**
    * Проверка условия для переноса звонка
    */
    //private checkTwoAttempts(newTryCount: number, oldTryCount: number): boolean {
    //    return newTryCount === 2 && newTryCount > oldTryCount;
    //}


    /**
    * Проверка необходимости переноса звонка при достижении заданного числа попыток
    * @param attemptNmber - Число попыток для проверки 
    * @param newCount - Текущее количество попыток
    * @param oldCount - Предыдущее количество попыток
    * @returns Возвращает true, только при переходе на заданное число попыток
    */
    private isAttemptNumber(attemptNmber: number, newCount: number, oldCount: number): boolean {
        return newCount === attemptNmber && oldCount < attemptNmber;
    }


    /**
    * Перенос звонка на начало следующего дня
    * @param entityId - id аабонента в списке
    */
    private async moveCallToNextDay(entityId: string): Promise<void> {

        // Получаем и обновляем абонента
        const entityCall = await this._simpleCalllists.getByIDStrong(entityId);

        if (!entityCall) {
            this.log.debug(`Абонент по ID ${entityId} не найден.`);
            return;
        }

        entityCall.scheduledTime = this.addOneHour();
    }


    /**
    * Начало следующего дня
    */
    private getStartOfNextDay(): Date {
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        return nextDay;
    }

    /**
    * Начало следующего часа
    */
    private getStartOfNextHour(): Date {
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1); // Добавляем 1 час
        nextHour.setMinutes(0, 0, 0); // Обнуляем минуты, секунды и миллисекунды
        return nextHour;
    }

    /**
    * Текущая дату/время + 1 час
    */
    private addOneHour(): Date {
        const date = new Date();
        date.setHours(date.getHours() + 1); // Просто добавляем 1 час
        return date;
    }


}


export default MainService;