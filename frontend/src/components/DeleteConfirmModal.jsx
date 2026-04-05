import { AlertCircleIcon } from "lucide-react";
import { useEffect } from "react";

const Modal = ({ children, onClose }) => {

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-in"
            >
                {children}
            </div>
        </div>
    );
};

export const DeleteConfirmModal = ({
    title = "Are you Sure?",
    description = "This Action Cannot Be Undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onClose,
    loading = false,
    variant = "danger", // danger | primary
}) => {
    const isDanger = variant === "danger";

    return (
        <Modal onClose={onClose}>
            <div className="text-center">
                {/* Icon */}
                <div className={`mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full 
                    ${isDanger ? "bg-red-100" : "bg-emerald-100"}`}>

                    <AlertCircleIcon
                        className={`w-6 h-6 ${isDanger ? "text-red-600" : "text-emerald-600"}`}
                    />
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold text-gray-900">
                    {title}
                </h2>

                {/* Description */}
                <p className="text-gray-600 mt-2 mb-6">
                    {description}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2 rounded-lg text-white 
                            ${isDanger ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}
                            disabled:opacity-50 flex items-center justify-center`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
