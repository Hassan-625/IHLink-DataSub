export const extraServices=['SMILE','ALPHA','KIRANI','DATA_CARD','RECHARGE_CARD','BULK_SMS'];
export function supportsService(provider:string,service:string){
 const standard=['DATA','AIRTIME','CABLE','ELECTRICITY','EXAM'];
 return standard.includes(service)||provider==='cashsub'&&extraServices.includes(service)||provider==='legitdataway'&&['SMILE','ALPHA','KIRANI'].includes(service);
}
const phone=(value:string)=>value.replace(/[\s()-]/g,'').replace(/^(?:\+234|00234|234)/,'0');
export function extraInput(service:string,body:any){
 let recipient=String(body.recipient||'').trim(),units=1,quantity=1;
 const account_type=String(body.account_type||'PhoneNumber'),sender=String(body.sender||'').trim(),message=String(body.message||'').trim(),card_name=String(body.card_name||'').trim();
 if(['DATA_CARD','RECHARGE_CARD'].includes(service)){
  quantity=Number(body.quantity??1);if(!Number.isInteger(quantity)||quantity<1||quantity>100)throw new Error('Choose between 1 and 100 cards.');units=quantity;
  if(card_name.length>80)throw new Error('Card name must be 80 characters or fewer.');recipient=card_name||'Card batch';
 }else if(service==='BULK_SMS'){
  const numbers=[...new Set(recipient.split(/[,;\s]+/).filter(Boolean).map(phone))];
  if(!numbers.length||numbers.length>100||numbers.some(n=>!/^0[789]\d{9}$/.test(n)))throw new Error('Enter up to 100 valid Nigerian phone numbers.');
  if(!/^[A-Za-z0-9 ]{2,11}$/.test(sender))throw new Error('Sender name must contain 2–11 letters, numbers or spaces.');
  // One GSM segment only until multipart/unicode billing is confirmed.
  const gsm=/^[A-Za-z0-9 \n\r!"#%&'()*+,\-.\/:;<=>?@_$]*$/;
  if(!message||message.length>160||!gsm.test(message))throw new Error('Use a message of up to 160 letters, numbers and basic punctuation.');
  recipient=numbers.join(',');units=numbers.length;
 }else if(service==='SMILE'){
  if(!['PhoneNumber','AccountNumber'].includes(account_type))throw new Error('Choose a phone number or Smile account number.');
  if(account_type==='PhoneNumber'){recipient=phone(recipient);if(!/^0[789]\d{9}$/.test(recipient))throw new Error('Enter a valid Nigerian phone number.');}
  else if(!/^[0-9]{5,30}$/.test(recipient))throw new Error('Enter a valid Smile account number.');
 }else if(['ALPHA','KIRANI'].includes(service)&&(!recipient||recipient.length<5||recipient.length>100))throw new Error('Enter a valid service account or phone number.');
 return {recipient,units,quantity,account_type,sender,message,card_name};
}
export async function savePurchaseDelivery(client:any,transaction:any,raw:any){
 const values=raw?.api_response?.cards||raw?.cards||raw?.api_response?.pins||raw?.pins||(Array.isArray(raw?.api_response)?raw.api_response:undefined);
 if(!Array.isArray(values))return;
 const cards=values.map((x:any)=>typeof x==='string'?{pin:x}:({pin:String(x.pin??x.PIN??''),serial:String(x.serial??x.serial_number??'')})).filter((x:any)=>x.pin);
 if(!cards.length)return;
 await client.from('datasub_purchase_deliveries').upsert({transaction_id:transaction.id,user_id:transaction.user_id,details:{cards}},{onConflict:'transaction_id'});
}
