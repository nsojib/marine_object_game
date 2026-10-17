export let scoring;
export let WRONG_PENALTY,CRASH_PENALTY;
export function configureScoring(config){
 const positive=['distance_meters_per_point','speed_knots_per_point'];
 const fields=['base_reward','distance_bonus_max',...positive,'depth_bonus_max','speed_bonus_max','wrong_penalty','crash_penalty'];
 if(!config||fields.some(k=>!Number.isFinite(config[k])||config[k]<0||(positive.includes(k)&&config[k]===0)))throw new Error('Invalid scoring configuration');
 scoring=Object.freeze({...config});
 WRONG_PENALTY=scoring.wrong_penalty;CRASH_PENALTY=scoring.crash_penalty;
}
export const WORLD={minX:-900,maxX:900,minZ:-4800,maxZ:1200,startZ:900,duration:480};
export function depthProgress(z){return Math.max(0,Math.min(1,(WORLD.startZ-z)/5400));}
export function expeditionConditions(z,score){const challenge=Math.max(depthProgress(z),Math.min(1,Math.max(0,score)/250)*.85);return {weather:challenge>.72?'Rain':challenge>.4?'Fog':'Clear',sea:challenge>.65?'Rough':challenge>.22?'Moderate':'Calm',zone:depthProgress(z)>.65?'DEEP SEA':depthProgress(z)>.22?'OFFSHORE':'COASTAL'};}
export function recognitionScore(distance,z,_unknown=false,speedMps=0){
 const rangeBonus=Math.min(scoring.distance_bonus_max,Math.max(0,distance)/scoring.distance_meters_per_point);
 const depthBonus=scoring.depth_bonus_max*depthProgress(z);
 const knots=Math.max(0,speedMps)*1.94384;
 const speedBonus=Math.min(scoring.speed_bonus_max,knots/scoring.speed_knots_per_point);
 return Math.round((scoring.base_reward+rangeBonus+depthBonus+speedBonus)*10)/10;
}
export function applyScore(score,delta){return Math.round(Math.max(0,score+delta)*10)/10;}
