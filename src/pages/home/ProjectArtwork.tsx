import type { Project } from '../../content/projects';
import styles from './ProjectArtwork.module.css';

type ProjectArtworkProps = { kind: Project['slug'] };

const projectLabels: Record<Project['slug'], string> = {
  'secure-bms-provenance': 'Secure BMS Provenance',
  lotlens: 'LotLens',
  sentinellog: 'SentinelLog',
  'phishing-shield': 'Phishing Shield',
  campuscopilot: 'CampusCopilot',
  'clara-co': 'Clara & Co',
};

export function ProjectArtwork({ kind }: ProjectArtworkProps) {
  return (
    <div className={styles.artwork} data-kind={kind} role="img" aria-label={projectLabels[kind] + ' interface concept visual'}>
      <div className={styles.window}>
        <header className={styles.topbar}>
          <span className={styles.brandMark}>{kind === 'clara-co' ? 'c.' : kind.slice(0, 1).toUpperCase()}</span>
          <span>{projectLabels[kind]}</span><i /><small>Project workspace</small>
        </header>
        {kind === 'secure-bms-provenance' ? <BmsScene /> : null}
        {kind === 'lotlens' ? <LotLensScene /> : null}
        {kind === 'sentinellog' ? <SentinelScene /> : null}
        {kind === 'phishing-shield' ? <PhishingScene /> : null}
        {kind === 'campuscopilot' ? <CampusScene /> : null}
        {kind === 'clara-co' ? <ClaraScene /> : null}
      </div>
    </div>
  );
}

function SideNav({ items }: { items: string[] }) {
  return <aside className={styles.sidebar}>{items.map((item, index) => <span className={index === 0 ? styles.sideActive : ''} key={item}>{item}</span>)}</aside>;
}

function BmsScene() {
  return (
    <div className={styles.appBody}>
      <SideNav items={['Overview', 'Components', 'Transfers', 'Certificates', 'Audit trail']} />
      <main className={styles.mainPanel}>
        <div className={styles.kicker}>COMPONENT / BMS-2026-001</div>
        <h3 className={styles.panelTitle}>Battery controller <span className={styles.good}>● On ledger</span></h3>
        <div className={styles.steps}>{['Manufactured', 'Certified', 'In transit', 'Warehouse', 'Assembly'].map((s, i) => <div className={styles.step} key={s}><b className={i < 3 ? styles.complete : ''}>{i < 3 ? '✓' : '0' + (i + 1)}</b><small>{s}</small></div>)}</div>
        <div className={styles.tableHeading}><b>Recent ledger events</b><small>BLOCK / TIME</small></div>
        {['Component registered', 'Certificate attached', 'Custody transferred'].map((s, i) => <div className={styles.row} key={s}><i />{s}<small>#{284 + i} · 10:{14 + i * 8} AM</small></div>)}
      </main>
    </div>
  );
}

function LotLensScene() {
  return (
    <div className={styles.appBody}>
      <SideNav items={['Investigations', 'Failure history', 'Corrective actions', 'Evidence']} />
      <main className={styles.mainPanel}>
        <div className={styles.kicker}>INVESTIGATION / LOT 8F-204</div>
        <h3 className={styles.panelTitle}>Seal pressure variance</h3>
        <div className={styles.metrics}>{[['Similar cases','08'],['Evidence linked','24'],['Confidence','High']].map(([a,b]) => <div key={a}><small>{a}</small><b>{b}</b></div>)}</div>
        <div className={styles.chartBox}><small>Failure signal across recent batches</small><div className={styles.bars}>{[31,54,42,74,61,88,57,69,38,92,63,78,49,66,84,45].map((v,i) => <span key={i} style={{height: v + '%'}} />)}</div></div>
        <div className={styles.insight}><small>RECALLED EVIDENCE</small><b>Temperature drift preceded 3 similar failures</b></div>
      </main>
    </div>
  );
}

function SentinelScene() {
  return (
    <div className={styles.appBody}>
      <SideNav items={['Dashboard', 'Live logs', 'Blocked IPs', 'Rules', 'Settings']} />
      <main className={styles.mainPanel}>
        <div className={styles.kicker}>SECURITY OVERVIEW / LAST 24 HOURS</div>
        <h3 className={styles.panelTitle}>Activity monitor</h3>
        <div className={styles.metrics}>{[['Login attempts','1,284'],['Failed logins','37'],['Blocked IPs','04']].map(([a,b]) => <div key={a}><small>{a}</small><b>{b}</b></div>)}</div>
        <div className={styles.tableHeading}><b>Recent activity</b><small>STATUS</small></div>
        {['Failed login · 185.22.14.8','Password spray · 91.4.18.23','Successful login · 10.0.0.14'].map((s,i) => <div className={styles.row} key={s}><i />{s}<small className={i === 2 ? styles.good : styles.risk}>{i === 2 ? 'Allowed' : 'Blocked'}</small></div>)}
      </main>
    </div>
  );
}

function PhishingScene() {
  return (
    <div className={styles.phishingBody}>
      <div className={styles.messagePane}>
        <div className={styles.kicker}>MESSAGE / INBOX</div>
        <h3 className={styles.emailTitle}>Your account needs attention</h3>
        <p className={styles.muted}>From: <b>support@secure-alert.example</b></p>
        <p className={styles.emailCopy}>We noticed unusual activity. Verify your account now to avoid temporary restrictions.</p>
        <div className={styles.fakeLink}>https://secure-alert.example/verify</div>
        <div className={styles.chips}><span>Urgency language</span><span>Credential request</span></div>
      </div>
      <div className={styles.scorePane}>
        <div className={styles.kicker}>ANALYSIS RESULT</div>
        <div className={styles.scoreRing}><b>86</b><small>/ 100</small></div>
        <b className={styles.risk}>High risk</b>
        <p className={styles.muted}>Suspicious indicators found in this message.</p>
        {['Urgency detected','Suspicious sender','Credential link'].map((s,i) => <div className={styles.finding} key={s}><small>0{i+1}</small>{s}</div>)}
      </div>
    </div>
  );
}

function CampusScene() {
  return (
    <div className={styles.campusBody}>
      <div className={styles.consolePane}>
        <div className={styles.kicker}>CAMPUS / COMMAND LINE</div>
        <p className={styles.prompt}>campus<span>@copilot</span>:~$</p>
        <p className={styles.command}>find nearest library</p>
        <p className={styles.response}>Matching places near you <small>3 results found</small></p>
        {['Central Library','Learning Commons','Research Block'].map((s,i) => <div className={styles.placeRow} key={s}><b>0{i+1}</b>{s}<small>{['0.4','0.8','1.2'][i]} km</small></div>)}
      </div>
      <div className={styles.mapPane}><span className={styles.mapPin}>●</span><span className={styles.mapLabel}>Library</span></div>
    </div>
  );
}

function ClaraScene() {
  return (
    <div className={styles.shopBody}>
      <div className={styles.shopHeading}><small>OBJECTS FOR EVERY DAY</small><h3>Find your everyday favourite.</h3><span>Considered pieces, made to be kept.</span></div>
      <div className={styles.productGrid}>
        {['THE EVERYDAY TOTE','STUDIO VASE','SOFT FORM MUG'].map((name,i) => <div className={styles.productTile} key={name}><div className={styles.productShape} data-shape={i} /><small>{name}</small><b>{['₹ 1,490','₹ 2,200','₹ 890'][i]}</b></div>)}
      </div>
    </div>
  );
}
