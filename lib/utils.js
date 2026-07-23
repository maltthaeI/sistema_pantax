"use client";
import React, { useState, useRef } from 'react';
import Icon from '@/components/Icon';

// ==== FORMATADORES ====
export const formatarValorFinanceiro = (valor) => {
    if (valor == null || isNaN(valor)) return '0,00';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
};

export const formatarMoeda = (valor) => {
    if (!valor) return '';
    const numeroLimpo = valor.toString().replace(/\D/g, '');
    if (numeroLimpo === '') return '';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseInt(numeroLimpo) / 100);
};

// Alíquotas: input mascarado em "%", mas armazenadas no banco como fração (0.0165, não 1.65).
export const formatarPercentual = (valor) => {
    if (!valor) return '';
    const numeroLimpo = valor.toString().replace(/\D/g, '');
    if (numeroLimpo === '') return '';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseInt(numeroLimpo) / 100);
};
export const percentualParaFracao = (percentualStr) => {
    if (!percentualStr) return 0;
    const num = parseFloat(String(percentualStr).replace(/\./g, '').replace(',', '.')) || 0;
    return num / 100;
};
export const fracaoParaPercentual = (fracao) => {
    if (fracao == null) return '';
    return formatarMoeda(((Number(fracao) * 100) * 100).toFixed(0).toString());
};

export const formatarCnpjCpf = (valor) => {
    if (!valor) return '';
    let v = valor.toString().replace(/\D/g, '');
    if (v.length <= 11) {
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    } else {
        if (v.length > 14) v = v.substring(0, 14);
        if (v.length > 12) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
        else if (v.length > 8) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
        else if (v.length > 5) v = v.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,3})/, '$1.$2');
    }
    return v;
};

export const obterDataAtual = () => new Date().toISOString().split('T')[0];

export const formatarDataExibicao = (dataISO) => {
    if (!dataISO) return '---';
    const partes = dataISO.split('-');
    if (partes.length !== 3) return dataISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const MESES_NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const formatarMesAno = (ano, mes) => `${MESES_NOMES[mes - 1]} / ${ano}`;
export const formatarMesAnoAbrev = (ano, mes) => `${MESES_ABREV[mes - 1]}/${ano}`;

// ==== SELECT CUSTOMIZADO (mesmo padrão do berlim-sistema) ====
export function CustomSelect({ value, options, onChange, className, placeholder = 'Selecione', disabled = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpwards, setOpenUpwards] = useState(false);
    const containerRef = useRef(null);
    const selected = options.find(o => o.value === value);

    const toggleDropdown = () => {
        if (disabled) return;
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setOpenUpwards(window.innerHeight - rect.bottom < 250);
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                onClick={toggleDropdown}
                className={`flex items-center justify-between ${className} ${isOpen ? 'border-brand ring-1 ring-brand/20' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className="truncate">{selected ? selected.label : placeholder}</span>
                <Icon name="chevron-down" className={`w-4 h-4 text-gray-400 shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && !disabled && (
                <>
                    <div className="fixed inset-0 z-[55]" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>
                    <ul className={`absolute left-0 z-[60] w-full min-w-[160px] max-h-60 overflow-y-auto bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded shadow-xl custom-scrollbar text-[13px] ${openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                        {options.map(opt => (
                            <li
                                key={opt.value}
                                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
                                className={`px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-darkHover cursor-pointer border-b border-gray-100 dark:border-darkBorder last:border-0 transition font-medium flex items-center justify-between gap-2 ${value === opt.value ? 'bg-brand/5 dark:bg-brand/10 text-brand' : 'text-gray-700 dark:text-[#EDEDED]'}`}
                            >
                                <span className="truncate">{opt.label}</span>
                                {value === opt.value && <Icon name="check" className="w-3.5 h-3.5 shrink-0" />}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

// ==== SWITCH (TOGGLE) ====
export function Switch({ checked, onChange, color = 'brand', className = '' }) {
    const coresAtivas = {
        brand: 'peer-checked:bg-brand',
        red: 'peer-checked:bg-red-500',
        blue: 'peer-checked:bg-blue-500',
    };
    return (
        <span className={`relative inline-flex items-center shrink-0 ${className}`}>
            <input
                type="checkbox"
                checked={!!checked}
                onChange={e => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <span className={`block w-9 h-5 rounded-full bg-gray-300 dark:bg-darkBorder peer transition-colors duration-200 ${coresAtivas[color] || coresAtivas.brand} peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 peer-focus-visible:ring-offset-1 dark:peer-focus-visible:ring-offset-darkBg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-4`}></span>
        </span>
    );
}

// ==== SPINNER (CUBE GRID) ====
export function CubeGridSpinner({ className = '' }) {
    return (
        <div className={`cube-grid ${className}`}>
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="cube" />)}
        </div>
    );
}
