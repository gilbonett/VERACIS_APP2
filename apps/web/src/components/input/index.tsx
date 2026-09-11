"use client";

import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
  TriangleAlert,
} from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import * as React from "react";
import {
  Controller,
  type ControllerFieldState,
  type ControllerProps,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

export type FeedbackType = "danger" | "success" | "info" | "warning";
export type Density = "small" | "medium" | "large" | "highlight";

type InputCtx = {
  isToggled: boolean;
  onToggle: () => void;
  disabled: boolean;
  feedbackType?: FeedbackType;
  density: Density;
  fieldId?: string;
  hasIcon: boolean;
  hasAction: boolean;
  setHasIcon: React.Dispatch<React.SetStateAction<boolean>>;
  setHasAction: React.Dispatch<React.SetStateAction<boolean>>;
};

type RHFFieldCtx = {
  field: Pick<
    ControllerRenderProps<FieldValues, string>,
    "onChange" | "onBlur" | "value" | "name" | "ref"
  >;
  fieldState: ControllerFieldState;
  name: string;
};

const InputContext = React.createContext<InputCtx | undefined>(undefined);
const RHFFieldContext = React.createContext<RHFFieldCtx | undefined>(undefined);

function useInputCtx() {
  const ctx = React.useContext(InputContext);
  if (!ctx)
    throw new Error("Component must be used inside <Input> or <FormField>");
  return ctx;
}

function useRHFField() {
  return React.useContext(RHFFieldContext);
}

const DENSITY_HEIGHT: Record<Density, string> = {
  small: "h-8",
  medium: "h-10",
  large: "h-12",
  highlight: "h-14",
};

const FEEDBACK_COLOR: Record<FeedbackType, string> = {
  danger: "var(--destructive)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
};

const FEEDBACK_CONFIG: Record<
  FeedbackType,
  { icon: React.ReactNode; className: string }
> = {
  danger: {
    icon: <AlertCircle className="size-3.5 shrink-0" />,
    className:
      "inline-flex items-center gap-1.5 mt-2 px-2 py-1 w-fit bg-destructive text-destructive-foreground text-xs font-semibold rounded-sm",
  },
  success: {
    icon: <CheckCircle className="size-3.5 shrink-0" />,
    className:
      "inline-flex items-center gap-1.5 mt-2 px-2 py-1 w-fit bg-success text-success-foreground text-xs font-semibold",
  },
  info: {
    icon: <Info className="size-3.5 shrink-0" />,
    className:
      "inline-flex items-center gap-1.5 mt-2 px-2 py-1 w-fit bg-info text-info-foreground text-xs font-semibold",
  },
  warning: {
    icon: <TriangleAlert className="size-3.5 shrink-0" />,
    className:
      "inline-flex items-center gap-1.5 mt-2 px-2 py-1 w-fit bg-warning text-warning-foreground text-xs font-semibolßd",
  },
};

type InputProviderProps = {
  children: React.ReactNode;
  disabled: boolean;
  feedbackType?: FeedbackType;
  density: Density;
  fieldId?: string;
};

function InputProvider({
  children,
  disabled,
  feedbackType,
  density,
  fieldId,
}: InputProviderProps) {
  const [isToggled, setIsToggled] = React.useState(false);
  const [hasIcon, setHasIcon] = React.useState(false);
  const [hasAction, setHasAction] = React.useState(false);

  const onToggle = React.useCallback(() => {
    if (!disabled) setIsToggled((p) => !p);
  }, [disabled]);

  const value = React.useMemo<InputCtx>(
    () => ({
      isToggled,
      onToggle,
      disabled,
      feedbackType,
      density,
      fieldId,
      hasIcon,
      setHasIcon,
      hasAction,
      setHasAction,
    }),
    [
      isToggled,
      onToggle,
      disabled,
      feedbackType,
      density,
      fieldId,
      hasIcon,
      hasAction,
    ],
  );

  return (
    <InputContext.Provider value={value}>{children}</InputContext.Provider>
  );
}

interface InputProps extends React.ComponentProps<"div"> {
  disabled?: boolean;
  feedbackType?: FeedbackType;
  density?: Density;
}

export function Input({
  className,
  disabled = false,
  feedbackType,
  density = "medium",
  ...props
}: InputProps) {
  return (
    <InputProvider
      disabled={disabled}
      feedbackType={feedbackType}
      density={density}
    >
      <div
        data-slot="input-root"
        data-disabled={disabled ? "true" : "false"}
        className={cn("w-full flex flex-col relative", className)}
        {...props}
      />
    </InputProvider>
  );
}

interface FormFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> extends Omit<React.ComponentProps<"div">, "children"> {
  control: ControllerProps<TValues, TName>["control"];
  name: TName;
  disabled?: boolean;
  density?: Density;
  children:
    | React.ReactNode
    | ((
        field: Parameters<
          ControllerProps<TValues, TName>["render"]
        >[0]["field"],
      ) => React.ReactNode);
}

export function FormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  control,
  name,
  disabled = false,
  density = "medium",
  className,
  children,
  ...props
}: FormFieldProps<TValues, TName>) {
  const fieldId = React.useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <InputProvider
          disabled={disabled}
          feedbackType={fieldState.error ? "danger" : undefined}
          density={density}
          fieldId={fieldId}
        >
          <RHFFieldContext.Provider value={{ field, fieldState, name }}>
            <div
              data-slot="form-field"
              data-disabled={disabled ? "true" : "false"}
              className={cn("w-full flex flex-col relative", className)}
              {...props}
            >
              {typeof children === "function" ? children(field) : children}
            </div>
          </RHFFieldContext.Provider>
        </InputProvider>
      )}
    />
  );
}

interface InputLabelProps extends React.ComponentProps<"label"> {
  required?: boolean;
}

export function InputLabel({
  className,
  required,
  htmlFor,
  children,
  ...props
}: InputLabelProps) {
  const ctx = React.useContext(InputContext);

  return (
    <label
      data-slot="input-label"
      htmlFor={htmlFor ?? ctx?.fieldId}
      className={cn(
        "block mb-1 text-sm font-medium text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-destructive" title="Campo obrigatório">
          *
        </span>
      )}
    </label>
  );
}

export function InputGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn("relative flex items-center w-full", className)}
      {...props}
    />
  );
}

export function InputControl({
  className,
  type,
  disabled,
  id,
  style,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<"input">) {
  const ctx = React.useContext(InputContext);
  const rhf = useRHFField();

  const isDisabled = disabled ?? ctx?.disabled ?? false;
  const feedbackType = ctx?.feedbackType;
  const density = ctx?.density ?? "medium";
  const { onBlur: rhfOnBlur, ...rhfProps } = rhf?.field ?? {};

  const [isFocused, setIsFocused] = React.useState(false);

  const stateColor = feedbackType ? FEEDBACK_COLOR[feedbackType] : null;
  const isActive = isFocused && !isDisabled;

  const borderColor = stateColor ?? (isActive ? "#C2850C" : "#888888");
  const borderWidth = (stateColor ?? isActive) ? "2px" : "1px";

  return (
    <input
      type={type}
      id={id ?? ctx?.fieldId}
      data-slot="input-control"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-invalid={feedbackType === "danger" ? "true" : undefined}
      style={{ borderColor, borderWidth, boxShadow: "none", ...style }}
      onFocus={(e) => {
        setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
        rhfOnBlur?.();
      }}
      className={cn(
        "w-full bg-background outline-none border rounded-sm",
        DENSITY_HEIGHT[density],
        "text-base md:text-sm font-medium text-foreground placeholder:text-muted-foreground",
        "transition-colors duration-150",
        ctx?.hasIcon ? "pl-10" : "pl-4",
        ctx?.hasAction ? "pr-10" : "pr-4",
        !isDisabled && "hover:bg-black/2",
        isDisabled &&
          "bg-muted opacity-70 text-muted-foreground placeholder:text-muted-foreground/60 cursor-not-allowed pointer-events-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...rhfProps}
      {...props}
    />
  );
}

export function InputPassword(props: React.ComponentProps<"input">) {
  const { isToggled } = useInputCtx();
  return (
    <InputControl
      data-slot="input-password"
      type={isToggled ? "text" : "password"}
      {...props}
    />
  );
}

export function InputToggle() {
  const { onToggle, isToggled, disabled, setHasAction } = useInputCtx();

  React.useEffect(() => {
    setHasAction(true);
    return () => setHasAction(false);
  }, [setHasAction]);

  return (
    <button
      data-slot="input-toggle"
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={isToggled ? "Ocultar senha" : "Mostrar senha"}
      className="absolute right-0 z-10 flex items-center justify-center w-10 h-full min-w-11 min-h-11 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50 focus:outline-none"
    >
      {isToggled ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

export function InputIcon({ name }: { name: IconName }) {
  const { setHasIcon } = useInputCtx();

  React.useEffect(() => {
    setHasIcon(true);
    return () => setHasIcon(false);
  }, [setHasIcon]);

  return (
    <div
      data-slot="input-icon"
      className="absolute left-0 z-10 flex items-center justify-center w-10 h-full text-[#888888] pointer-events-none"
    >
      <DynamicIcon name={name} className="size-4" />
    </div>
  );
}

interface InputActionProps extends React.ComponentProps<"button"> {
  iconName: IconName;
}

export function InputAction({
  type,
  iconName,
  disabled,
  className,
  "aria-label": ariaLabel,
  ...props
}: InputActionProps) {
  const ctx = React.useContext(InputContext);

  React.useEffect(() => {
    ctx?.setHasAction(true);
    return () => ctx?.setHasAction(false);
  }, []);

  return (
    <button
      type={type}
      data-slot="input-action"
      disabled={disabled ?? ctx?.disabled ?? false}
      aria-label={ariaLabel}
      className={cn(
        "absolute right-0 z-10 flex items-center justify-center w-10 h-full min-w-11 min-h-11",
        "text-primary hover:text-primary/70 transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none",
        className,
      )}
      {...props}
    >
      <DynamicIcon name={iconName} className="size-4" />
    </button>
  );
}

interface InputFeedbackProps extends React.ComponentProps<"p"> {
  type: FeedbackType;
}

export function InputFeedback({
  type,
  className,
  children,
  ...props
}: InputFeedbackProps) {
  const { icon, className: baseClass } = FEEDBACK_CONFIG[type];
  return (
    <p
      data-slot="input-feedback"
      role={type === "danger" ? "alert" : "note"}
      className={cn(baseClass, className)}
      {...props}
    >
      {icon}
      {children}
    </p>
  );
}

export function FormError({ className }: { className?: string }) {
  const rhf = useRHFField();
  if (!rhf?.fieldState.error) return null;
  return (
    <InputFeedback type="danger" className={className}>
      {rhf.fieldState.error.message}
    </InputFeedback>
  );
}

export function InputHelp({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="input-help"
      className={cn(
        "flex items-center gap-1.5 mt-1 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Info className="size-3.5 shrink-0" />
      {children}
    </p>
  );
}

interface InputCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function InputCounter({ current, max, className }: InputCounterProps) {
  return (
    <p
      data-slot="input-counter"
      className={cn(
        "mt-1 text-xs text-right",
        current > max
          ? "text-destructive font-semibold"
          : "text-muted-foreground",
        className,
      )}
    >
      {current}/{max}
    </p>
  );
}
