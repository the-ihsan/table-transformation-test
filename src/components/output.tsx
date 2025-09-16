interface OutputProps {
  output: string;
  className?: string;
}

const Output = ({ output, className }: OutputProps) => {
  return (
    <div className={`flex-1 overflow-hidden flex flex-col px-4 py-2 ${className}`}>
      <h2 className="text-lg font-semibold py-2 border-y">Output</h2>
      <div
        className="flex-1 overflow-auto shadow-sm"
        dangerouslySetInnerHTML={{ __html: output }}
      />
    </div>
  );
};

export default Output;
