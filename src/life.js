export let MAX_LIFE;
export let LIFE_LOSS;
export function configureLife(config){
 MAX_LIFE=config.total_life;
 LIFE_LOSS=Object.freeze({wrong:config.wrong_life_penalty,collision:config.crash_life_penalty});
}
export function remainingLife(life,cause){return Math.max(0,life-LIFE_LOSS[cause]);}
