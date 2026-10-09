import {MobileBrandPreview} from './MobileBrandPreview';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
const cards=[
 {title:'Stay connected, every day',caption:'Find your next data plan',image:'/mobile/data-everyday.webp',to:'/datasub/buy/data',cta:'Buy data'},
 {title:'Make more time for you',caption:'Airtime and bills in one place',image:'/mobile/data-bills.webp',to:'/datasub/services',cta:'View services'},
 {title:'Keep the conversation going',caption:'Top up for the people you care about',image:'/mobile/data-connect.webp',to:'/datasub/buy/airtime',cta:'Buy airtime'},
 {title:'A helping hand when you need it',caption:'Reach your IHLink support team',image:'/mobile/data-everyday.webp',to:'/datasub/support',cta:'Get help'},
];
export function NativePromotions(){
 const [index,setIndex]=useState(0);const card=cards[index];
 return <section className="native-promotions" aria-label="Discover DataSub"><Link to={card.to} className="native-promo-card"><div><p className="promo-eyebrow">Made for your everyday</p><h2>{card.title}</h2><p className="promo-caption">{card.caption}</p><span className="promo-cta">{card.cta}<ArrowRight size={15}/></span></div><img src={card.image} alt="" loading="lazy"/><MobileBrandPreview kind={[4,1,5,3][index]}/></Link><div className="promo-dots" aria-label="Featured cards">{cards.map((item,i)=><button type="button" key={item.title} aria-label={`Show featured card ${i+1}`} aria-pressed={i===index} onClick={()=>setIndex(i)}><span className={i===index?'selected':''}/></button>)}</div></section>;
}
