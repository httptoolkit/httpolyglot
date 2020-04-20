import {EventEmitter} from "events"
import assert from "assert"

const proxykeys=["addListener","on","prependListener]
export function onlyonelistener(emitter:EventEmitter){
emitter.setMaxListeners(1)
return new Proxy(emitter,{

get(target,key){

const value=Reflect.get(target,key)
if(proxykeys.includes(key)){


return new Proxy(value,{



apply(target, thisArgument, argumentsList){
	const [eventName,listener]=argumentsList
	assert(typeof eventName==="string")
	assert(typeof listener==="function")
	Reflect.apply(EventEmitter.prototype.removeAllListeners,

thisArgument,argumentsList)
	
	
	
	return Reflect.apply(target, thisArgument, argumentsList)




}


})
}else{

return value
}






}})
}