import { type Component, type JSX, splitProps } from 'solid-js';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ['variant', 'size', 'class', 'children']);
  
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };
  
  // Make classes reactive by using a getter function
  const classes = () => `${baseClasses} ${variants[local.variant || 'primary']} ${sizes[local.size || 'md']} ${local.class || ''}`;
  
  return (
    <button class={classes()} {...rest}>
      {local.children}
    </button>
  );
};
