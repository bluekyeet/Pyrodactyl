import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import { useFitText } from '@flyyer/use-fit-text';

import CopyOnClick from '@/components/elements/CopyOnClick';
import Icon from '@/components/elements/Icon';

import styles from './style.module.css';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined;
    icon: IconDefinition;
    children: ReactNode;
    className?: string;
}

function StatBlock({ title, copyOnClick, icon, color, className, children }: StatBlockProps) {
    const { fontSize, ref } = useFitText({ minFontSize: 8, maxFontSize: 500 });

    return (
        <CopyOnClick text={copyOnClick}>
            <div className={classNames(styles.stat_block, 'bg-zinc-600', className)}>
                <div className={classNames(styles.status_bar, color || 'bg-zinc-700')} />
                <div className={classNames(styles.icon, color || 'bg-zinc-700')}>
                    <Icon
                        icon={icon}
                        className={classNames({
                            'text-zinc-100': !color || color === 'bg-zinc-700',
                            'text-zinc-50': color && color !== 'bg-zinc-700',
                        })}
                    />
                </div>
                <div className={'flex w-full flex-col justify-center overflow-hidden'}>
                    <p className={'font-jakarta text-xs leading-tight text-zinc-200 md:text-sm'}>{title}</p>
                    <div
                        ref={ref}
                        className={'h-[1.75rem] w-full truncate font-semibold text-zinc-50'}
                        style={{ fontSize }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
}

export default StatBlock;
