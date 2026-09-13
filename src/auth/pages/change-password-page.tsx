import { useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  LoaderCircleIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  ChangePasswordSchemaType,
  getChangePasswordSchema,
} from '../forms/change-password-schema';

export function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(getChangePasswordSchema()),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: ChangePasswordSchemaType) {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccessMessage(null);

      await changePassword(values.currentPassword, values.newPassword);

      // When successful, other sessions are revoked
      setSuccessMessage(
        'Password changed successfully. All other sessions have been logged out.',
      );
      form.reset();
    } catch (err: any) {
      console.error('Change password error:', err);

      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      if (status === 401) {
        setError('Current password is incorrect.');
      } else if (status === 403) {
        setError('New password must be different from current password.');
      } else if (status === 400 && Array.isArray(msg)) {
        setError(msg.join(', '));
      } else {
        setError(
          msg ||
            err?.message ||
            'An error occurred while changing password. Please try again.',
        );
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="text-center space-y-1 pb-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Change Password
            </h1>
            <p className="text-sm text-muted-foreground">
              New password must be at least 12 characters
            </p>
          </div>

          {error && (
            <Alert
              variant="destructive"
              appearance="light"
              onClose={() => setError(null)}
            >
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          {successMessage && (
            <Alert
              appearance="light"
              className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
              onClose={() => setSuccessMessage(null)}
            >
              <AlertIcon>
                <Check className="text-green-600 dark:text-green-400" />
              </AlertIcon>
              <AlertTitle>{successMessage}</AlertTitle>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="Enter current password"
                      type={currentPasswordVisible ? 'text' : 'password'}
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    mode="icon"
                    onClick={() =>
                      setCurrentPasswordVisible(!currentPasswordVisible)
                    }
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                    {currentPasswordVisible ? (
                      <EyeOff className="text-muted-foreground" />
                    ) : (
                      <Eye className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password (minimum 12 characters)</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="Enter new password"
                      type={newPasswordVisible ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    mode="icon"
                    onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                    {newPasswordVisible ? (
                      <EyeOff className="text-muted-foreground" />
                    ) : (
                      <Eye className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="Confirm your new password"
                      type={confirmPasswordVisible ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    mode="icon"
                    onClick={() =>
                      setConfirmPasswordVisible(!confirmPasswordVisible)
                    }
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  >
                    {confirmPasswordVisible ? (
                      <EyeOff className="text-muted-foreground" />
                    ) : (
                      <Eye className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />{' '}
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </Button>

          <div className="text-center text-sm">
            <Link
              to="/"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
