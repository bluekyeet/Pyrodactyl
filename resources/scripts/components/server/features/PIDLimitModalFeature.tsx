import { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import Modal from '@/components/elements/Modal';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import { SocketEvent } from '@/components/server/events';
import { useStoreState } from 'easy-peasy';

const PIDLimitModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading] = useState(false);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const isAdmin = useStoreState((state) => state.user.data!.rootAdmin);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = [
            'pthread_create failed',
            'failed to create thread',
            'unable to create thread',
            'unable to create native thread',
            'unable to create new native thread',
            'exception in thread "craft async scheduler management thread"',
        ];

        const listener = (line: string) => {
            if (errors.some((p) => line.toLowerCase().includes(p))) {
                setVisible(true);
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    useEffect(() => {
        clearFlashes('feature:pidLimit');
    }, []);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            closeOnBackground={false}
            showSpinnerOverlay={loading}
        >
            <FlashMessageRender key={'feature:pidLimit'} className={`mb-4`} />
            {isAdmin ? (
                <>
                    <div className={`mt-4 sm:flex items-center`}>
                        <h2 className={`text-2xl mb-4 text-zinc-100 `}>Memory or process limit reached...</h2>
                    </div>
                    <p className={`mt-4`}>This server has reached the maximum process or memory limit.</p>
                    <p className={`mt-4`}>
                        Increasing <code className={`font-mono bg-zinc-900`}>container_pid_limit</code> in the wings
                        configuration, <code className={`font-mono bg-zinc-900`}>config.yml</code>, might help resolve
                        this issue.
                    </p>
                    <p className={`mt-4`}>
                        <b>Note: Wings must be restarted for the configuration file changes to take effect</b>
                    </p>
                    <div className={`mt-8 sm:flex items-center justify-end`}>
                        <Button onClick={() => setVisible(false)} className={`w-full sm:w-auto border-transparent`}>
                            <div>close</div>
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <div className={`mt-4 sm:flex items-center`}>
                        <h2 className={`text-2xl mb-4 text-zinc-100`}>Possible resource limit reached...</h2>
                    </div>
                    <p className={`mt-4`}>
                        This server is attempting to use more resources than allocated. Please contact the administrator
                        and give them the error below.
                    </p>
                    <p className={`mt-4`}>
                        <code className={`font-mono bg-zinc-900`}>
                            pthread_create failed, Possibly out of memory or process/resource limits reached
                        </code>
                    </p>
                    <div className={`mt-8 sm:flex items-center justify-end`}>
                        <Button onClick={() => setVisible(false)} className={`w-full sm:w-auto border-transparent`}>
                            <div>close</div>
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
};

export default PIDLimitModalFeature;
