
import React, { Component, ErrorInfo, ReactNode } from "react";
import { getUserFacingErrorMessage } from "../lib/errors";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            const friendlyMessage = getUserFacingErrorMessage(this.state.error);
            return (
                <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center p-6 text-center">
                    <div className="max-w-md">
                        <h1 className="text-4xl font-bold mb-4">Something went wrong.</h1>
                        <p className="text-black/50 mb-8">
                            We've encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-black text-white rounded-xl font-bold"
                        >
                            Refresh Page
                        </button>
                        <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                            {friendlyMessage}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
