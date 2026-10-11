import assert from 'node:assert/strict';
import test from 'node:test';
import {extraInput,supportsService} from '../supabase/functions/_shared/extraServices.ts';
import {quotePurchase} from '../supabase/functions/_shared/pricing.ts';
test('a card batch reserves the full quantity price',()=>{const input=extraInput('DATA_CARD',{quantity:20});assert.equal(input.units,20);assert.equal(quotePurchase('DATA_CARD','smart_earner',{smart_earner_price:263},0,input.units).charge,5260);for(const quantity of [0,-1,1.5,101])assert.throws(()=>extraInput('DATA_CARD',{quantity}));});
test('SMS normalizes and deduplicates numbers before charging',()=>{const input=extraInput('BULK_SMS',{recipient:'08031234567,+2348031234567;09041234567',sender:'IHLink',message:'School closes at 2pm.'});assert.equal(input.units,2);assert.equal(input.recipient,'08031234567,09041234567');assert.equal(quotePurchase('BULK_SMS','smart_earner',{smart_earner_price:4},0,input.units).charge,8);});
test('unsupported routes cannot fall through to a data purchase',()=>{assert.equal(supportsService('datastation','KIRANI'),false);assert.equal(supportsService('legitdataway','VITEL'),false);assert.equal(supportsService('cashsub','DATA_CARD'),true);assert.equal(supportsService('legitdataway','SMILE'),true);});
test('invalid Smile accounts and unconfirmed SMS billing formats are rejected',()=>{assert.throws(()=>extraInput('SMILE',{recipient:'123',account_type:'PhoneNumber'}));assert.throws(()=>extraInput('BULK_SMS',{recipient:'08031234567',sender:'IHLink',message:'A'.repeat(161)}));assert.throws(()=>extraInput('BULK_SMS',{recipient:'08031234567',sender:'IHLink',message:'Hello 😀'}));});

