import { useNavigate } from 'react-router-dom';
import { TEXT } from '../constants/text';
import { SOLO_VARIANT_LIST, DUO_VARIANT_LIST } from '../domain/scoring';

const TopPage = () => {
    const navigate = useNavigate();

    return (
        <div className="page">
            <section className="hero">
                <div className="hero-content">
                    <p className="eyebrow">{TEXT.hero.eyebrow}</p>
                    <h1>{TEXT.hero.title}</h1>
                    <p className="lede">{TEXT.hero.lead}</p>
                    <div className="cta-row">
                        <button className="btn primary" onClick={() => navigate('/quiz')}>
                            {TEXT.hero.ctaPrimary}
                        </button>
                    </div>
                    <ul className="pill-list">
                        {TEXT.hero.pills.map((pill) => (
                            <li key={pill}>{pill}</li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="grid two">
                <div className="card">
                    <h3>{TEXT.steps.do.title}</h3>
                    <p>{TEXT.steps.do.body}</p>
                </div>
                <div className="card">
                    <h3>{TEXT.steps.pair.title}</h3>
                    <p>{TEXT.steps.pair.body}</p>
                </div>
            </section>

            <section className="card">
                <p className="eyebrow">ソロタイプ一覧（16）</p>
                <div className="grid two">
                    {SOLO_VARIANT_LIST.map((v) => (
                        <div key={v.id} className="mini-card">
                            <h4>{v.label}</h4>
                            <p className="eyebrow" style={{ marginTop: '0.25rem' }}>{v.avatar}</p>
                            <p className="small">{v.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="card">
                <p className="eyebrow">デュオタイプ一覧（8）</p>
                <div className="grid two">
                    {DUO_VARIANT_LIST.map((v) => (
                        <div key={v.id} className="mini-card">
                            <h4>{v.title}</h4>
                            <p className="small">{v.message}</p>
                            <ul className="small">
                                {v.tips.slice(0, 2).map((t) => (
                                    <li key={t}>{t}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default TopPage;
