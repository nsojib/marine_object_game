export const WORLD={minX:-900,maxX:900,minZ:-4800,maxZ:1200,startZ:900,duration:480};
export function depthProgress(z){return Math.max(0,Math.min(1,(WORLD.startZ-z)/5400));}
export function expeditionConditions(z,score){const challenge=Math.max(depthProgress(z),Math.min(1,Math.max(0,score)/100)*.85);return {weather:challenge>.72?'Rain':challenge>.4?'Fog':'Clear',sea:challenge>.65?'Rough':challenge>.22?'Moderate':'Calm',zone:depthProgress(z)>.65?'DEEP SEA':depthProgress(z)>.22?'OFFSHORE':'COASTAL'};}
export function recognitionScore(distance,z,unknown=false){return Math.round((Math.max(.3,Math.min(6,distance/600*6))+depthProgress(z)*2+(unknown?2:0))*10)/10;}
export function applyScore(score,delta){return Math.round(Math.max(0,Math.min(100,score+delta))*10)/10;}
