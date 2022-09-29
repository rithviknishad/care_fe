import { ErrorHelperText } from "../HelperInputFields";

type BaseProps = {
  name?: string;
  id?: string;
  autoComplete?: string;
  type?: "email" | "password" | "search" | "text";
  label?: string;
  placeholder?: string;
  value?: string | number;
  onValueChange?: (value: string) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
};

type Props =
  | (BaseProps & {
      onValueChange?: (value: string) => void;
    })
  | (BaseProps & {
      onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    });

const TextInputFieldV2 = (props: Props) => {
  const { onChange, onValueChange } = props;

  return (
    <div>
      {props.label && (
        <label className="mb-2" htmlFor={props.id}>
          {props.label + ((props.required && " *") || "")}
        </label>
      )}
      <input
        id={props.id}
        className={
          "block w-full input" + ((props.error && "border-error") || "")
        }
        type={props.type || "text"}
        name={props.name || props.id}
        autoComplete={props.autoComplete || props.name || props.id}
        value={props.value}
        placeholder={props.placeholder}
        onChange={
          onChange || ((e) => onValueChange && onValueChange(e.target.value))
        }
      />
      <ErrorHelperText error={props.error} />
    </div>
  );
};

export default TextInputFieldV2;
