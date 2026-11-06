import type { ReceivedAlertDto } from '@helpjuy/contracts';
import { Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { AlertsHistory } from '@/features/alerts/components/AlertsHistory';
import styles from '@/features/alerts/components/alerts.module.css';
import { PanelPage } from '@/features/panel/components/PanelPage';
import box from '@/features/panel/components/panel-page.module.css';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Avisos — HelpJuy' };

export default async function AvisosPage() {
  const alerts = await apiServer<ReceivedAlertDto[]>('/alerts');
  if (!alerts) redirect('/ingresar?next=/panel/avisos');

  return (
    <PanelPage
      title="Avisos"
      subtitle="Cuando alguien escanea un QR tuyo o de tu familia y marca una emergencia, queda acá con la zona en el mapa."
      asideLabel="Sobre los avisos"
      aside={
        <section className={box.box}>
          <h2 className={box.boxTitle}>Qué se guarda</h2>
          <ul className={styles.facts}>
            <li>
              <MapPin size={18} aria-hidden="true" />
              <span>
                La ubicación es <strong>aproximada</strong> (unos 100 metros) y solo si quien escaneó la compartió.
              </span>
            </li>
            <li>
              <Clock size={18} aria-hidden="true" />
              <span>
                Se borra a los <strong>30 días</strong>. Después de eso el aviso ya no aparece.
              </span>
            </li>
            <li>
              <Users size={18} aria-hidden="true" />
              <span>Ves los de tus fichas y los de tu familia desde que entraste al grupo, no los de antes.</span>
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden="true" />
              <span>
                Un aviso puede no ser real. Si es de alguien de tu familia, intentá llamarlo; si no responde, llamá al{' '}
                <a href="tel:107">107</a>.
              </span>
            </li>
          </ul>
        </section>
      }
    >
      <AlertsHistory alerts={alerts} />
    </PanelPage>
  );
}
