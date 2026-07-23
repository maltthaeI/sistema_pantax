"use client";
import { useAppContext } from '@/context/AppContext';
import Icon from '@/components/Icon';
import ResumoCfopTab from '@/components/ResumoCfopTab';
import IcmsTab from '@/components/IcmsTab';
import PisCofinsTab from '@/components/PisCofinsTab';

const SUBABAS = [
    { key: 'emitidas', label: 'Emitidas', icon: 'trending-up' },
    { key: 'recebidas', label: 'Recebidas', icon: 'trending-down' },
    { key: 'cte', label: 'CT-e', icon: 'truck' },
    { key: 'icms', label: 'ICMS', icon: 'dollar-sign' },
    { key: 'pis_cofins', label: 'PIS/COFINS', icon: 'percent' },
];

export default function ResumoTab() {
    const { resumoSubAba, setResumoSubAba } = useAppContext();

    return (
        <div className="flex flex-col">
            <div className="px-6 pt-3 flex gap-1 border-b border-gray-200 dark:border-darkBorder bg-white dark:bg-darkBg overflow-x-auto no-scrollbar-style">
                {SUBABAS.map(sub => (
                    <button
                        key={sub.key}
                        type="button"
                        onClick={() => setResumoSubAba(sub.key)}
                        className={`px-4 py-2 text-[11px] font-semibold cursor-pointer transition whitespace-nowrap rounded-t-md flex items-center gap-1.5 uppercase tracking-wide border-b-2 ${resumoSubAba === sub.key ? 'border-brand text-brand' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        <Icon name={sub.icon} className="w-3.5 h-3.5" /> {sub.label}
                    </button>
                ))}
            </div>

            {resumoSubAba === 'emitidas' && <ResumoCfopTab origem="emitidas" titulo="Emitidas" mostrarGerar />}
            {resumoSubAba === 'recebidas' && <ResumoCfopTab origem="recebidas" titulo="Recebidas" />}
            {resumoSubAba === 'cte' && <ResumoCfopTab origem="cte" titulo="CT-e" />}
            {resumoSubAba === 'icms' && <IcmsTab />}
            {resumoSubAba === 'pis_cofins' && <PisCofinsTab />}
        </div>
    );
}
