import {MobileBrandPreview} from './MobileBrandPreview';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
const slides=[{"image": "/mobile/data-everyday.webp", "title": "Everyday payments, in your pocket", "description": "Data, airtime and bills in one simple app."}, {"image": "/mobile/data-bills.webp", "title": "Less time on bills. More time for you.", "description": "Choose a service, check the details and pay."}, {"image": "/mobile/data-connect.webp", "title": "Stay close. Stay connected.", "description": "Top up and keep your conversations going."}];
export function NativeSignedOutHome(){
 const [index,setIndex]=useState(0);const slide=slides[index];
 return <main className="welcome-screen datasub"><header className="welcome-brand"><img src="/brand/ihlink-icon.png" alt=""/><span>IHLink DataSub</span></header><div className="welcome-progress" aria-label="Welcome slides">{slides.map((item,i)=><button key={item.image} type="button" aria-label={`Welcome slide ${i+1}`} aria-current={index===i?'step':undefined} onClick={()=>setIndex(i)}><span className={i<=index?'shown':''}/></button>)}</div><button type="button" className="welcome-art" aria-label="Next welcome slide" onClick={()=>setIndex((index+1)%slides.length)}><img src={slide.image} alt="" loading="eager"/><MobileBrandPreview kind={index}/></button><section className="welcome-copy" aria-live="polite"><p className="welcome-eyebrow">Welcome to DataSub</p><h1>{slide.title}</h1><p>{slide.description}</p></section><section className="welcome-actions"><Link className="welcome-primary" to="/register">Create account<ArrowRight size={18}/></Link><Link className="welcome-secondary" to="/signin">Sign in</Link></section></main>;
}
