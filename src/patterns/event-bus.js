class EventBus{constructor(){this.listeners=new Map();}subscribe(name,handler){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(handler);return()=>this.listeners.get(name).delete(handler);}publish(name,payload){for(const listener of this.listeners.get(name)||[])listener(payload);}}
const events=new EventBus();module.exports={EventBus,events};
