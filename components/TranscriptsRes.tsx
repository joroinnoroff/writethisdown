import { FileText, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface TranscriptResultProps {
  text: string;
}

const TranscriptionResult = ({ text }: TranscriptResultProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <FileText className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
          <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200'>
            transcription results:
          </h2>
        </div>
        <button
          onClick={handleCopy}
          className='flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-600 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700'>

          {copied ? (
            <CheckCircle className='w-4 h-4 text-green-500' />
          ) : (
            <Copy className='w-4 h-4' />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className='h-[calc(100vh-12rem)] p-6 bg-white dark:bg-gray-900 rounded-xl overflow-auto border border-gray-100 dark:border-gray-300'>
        <p className='text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed'>
          {text}
        </p>
      </div>
    </div>
  )
}

export default TranscriptionResult;
