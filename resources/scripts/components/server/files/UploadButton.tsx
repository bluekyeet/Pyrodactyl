import axios from 'axios';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import tw from 'twin.macro';
import { useEffect, useRef, useState } from 'react';
import { ModalMask } from '@/components/elements/Modal';
import useEventListener from '@/plugins/useEventListener';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { ServerContext } from '@/state/server';
import Portal from '@/components/elements/Portal';
// FIXME: add icons back
import FadeTransition from '@/components/elements/transitions/FadeTransition';

function isFileOrDirectory(event: DragEvent): boolean {
    if (!event.dataTransfer?.types) {
        return false;
    }

    return event.dataTransfer.types.some((value) => value.toLowerCase() === 'files');
}

export default () => {
    const fileUploadInput = useRef<HTMLInputElement>(null);
    const [timeouts, setTimeouts] = useState<NodeJS.Timeout[]>([]);
    const [visible, setVisible] = useState(false);
    const { mutate } = useFileManagerSwr();
    const { addError, clearAndAddHttpError } = useFlashKey('files');

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { clearFileUploads, appendFileUpload, removeFileUpload } = ServerContext.useStoreActions(
        (actions) => actions.files
    );

    useEventListener(
        'dragenter',
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isFileOrDirectory(e)) {
                return setVisible(true);
            }
        },
        { capture: true }
    );

    useEventListener('dragexit', () => setVisible(false), { capture: true });

    useEventListener('keydown', () => {
        visible && setVisible(false);
    });

    useEffect(() => {
        return () => timeouts.forEach(clearTimeout);
    }, []);

    const onUploadProgress = (data: ProgressEvent, name: string) => {
        appendFileUpload({ name, loaded: data.loaded, total: data.total });
        if (data.loaded >= data.total) {
            const timeout = setTimeout(() => removeFileUpload(name), 500);
            setTimeouts((t) => [...t, timeout]);
        }
    };

    const onFileSubmission = (files: FileList) => {
        clearAndAddHttpError();
        const list = Array.from(files);
        if (list.some((file) => !file.size || (!file.type && file.size === 4096))) {
            return addError('Folder uploads are not supported at this time.', 'Error');
        }

        if (!list.length) {
            return;
        }

        const uploads = list.map((file) => {
            appendFileUpload({ name: file.name, loaded: 0, total: file.size });
            return () =>
                getFileUploadUrl(uuid).then((url) =>
                    axios.post(
                        url,
                        { files: file },
                        {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            params: { directory },
                            onUploadProgress: (data) => {
                                onUploadProgress(data, file.name);
                            },
                        }
                    )
                );
        });

        Promise.all(uploads.map((fn) => fn()))
            .then(() => mutate())
            .catch((error) => {
                clearFileUploads();
                clearAndAddHttpError(error);
            });
    };

    return (
        <>
            <Portal>
                <FadeTransition show={visible} duration='duration-75' key='upload_modal_mask' appear unmount>
                    <ModalMask
                        onClick={() => setVisible(false)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            setVisible(false);
                            if (!e.dataTransfer?.files.length) return;

                            onFileSubmission(e.dataTransfer.files);
                        }}
                    >
                        <div className={'w-full flex items-center justify-center pointer-events-none'}>
                            <div
                                className={
                                    'flex items-center space-x-4 bg-black w-full ring-4 ring-blue-200 ring-opacity-60 rounded p-6 mx-10 max-w-sm'
                                }
                            >
                                {/* <CloudUploadIcon className={'w-10 h-10 flex-shrink-0'} /> */}
                                <p className={' flex-1 text-lg text-zinc-100 text-center'}>
                                    Drag and drop files to upload.
                                </p>
                            </div>
                        </div>
                    </ModalMask>
                </FadeTransition>
            </Portal>
            <input
                type={'file'}
                ref={fileUploadInput}
                className={`hidden`}
                onChange={(e) => {
                    if (!e.currentTarget.files) return;

                    onFileSubmission(e.currentTarget.files);
                    if (fileUploadInput.current) {
                        fileUploadInput.current.files = null;
                    }
                }}
                multiple
            />
            <button
                style={{
                    background:
                        'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                }}
                className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-r-full rounded-l-md text-sm font-bold shadow-md'
                onClick={() => fileUploadInput.current && fileUploadInput.current.click()}
            >
                Upload
            </button>
        </>
    );
};
