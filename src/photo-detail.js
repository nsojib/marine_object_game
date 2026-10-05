/** Resolve a normalized subject box with context padding and a slight framing offset. */
export function photoCrop(width,height,bounds){
 const [x,y,w,h]=bounds;
 const cw=Math.min(width,w*width*1.3),ch=Math.min(height,h*height*1.3);
 return {x:Math.max(0,Math.min(width-cw,(x+w/2)*width-cw/2+w*width*.04)),
 y:Math.max(0,Math.min(height-ch,(y+h/2)*height-ch/2-h*height*.03)),width:cw,height:ch};
}
/** Recognizable distant silhouettes with a gradual increase in detail on approach. */
export function photoResolution(distance,width,height){
 const range=Math.max(0,(Number.isFinite(distance)?distance:1200)-20)/60;
 const pixels=Math.round((24+488/(1+range**2))/2)*2;
 const longest=Math.max(1,Math.min(Math.max(width,height),pixels));
 const scale=longest/Math.max(width,height);
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
