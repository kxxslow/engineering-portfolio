import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ClipboardCheck, UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type CustomerForm = {
    name: string;
    email: string;
    phone: string;
    notes: string;
};

export default function NewCustomer() {
    const { data, setData, post, processing, errors } = useForm<CustomerForm>({
        name: '',
        email: '',
        phone: '',
        notes: '',
    });

    return (
        <AppShell context="Customer intake">
            <Head title="New customer" />
            <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-semibold text-slate-950">
                                    Add customer
                                </div>
                                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                                    Add the contact details needed to place the
                                    customer into a booking request.
                                </p>
                            </div>
                            <UserPlus className="h-5 w-5 text-sky-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid grid-cols-2 gap-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                post('/customers');
                            }}
                        >
                            <div className="col-span-2">
                                <Field label="Name" error={errors.name}>
                                    <Input
                                        autoComplete="name"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                            <Field label="Email" error={errors.email}>
                                <Input
                                    autoComplete="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) =>
                                        setData('email', event.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Phone" error={errors.phone}>
                                <Input
                                    autoComplete="tel"
                                    value={data.phone}
                                    onChange={(event) =>
                                        setData('phone', event.target.value)
                                    }
                                />
                            </Field>
                            <div className="col-span-2">
                                <Field label="Operations note" error={errors.notes}>
                                    <textarea
                                        className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        value={data.notes}
                                        onChange={(event) =>
                                            setData(
                                                'notes',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                            <div className="col-span-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                <Link
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                    href="/customers"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to customers
                                </Link>
                                <Button disabled={processing}>
                                    Create customer
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-5">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                                <ClipboardCheck className="h-4 w-4 text-sky-600" />
                                Intake boundary
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                            <p>
                                Customer intake captures contact context for
                                booking requests only.
                            </p>
                            <p>
                                Staff, room, and service rules still decide
                                whether a reservation is accepted.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div className="text-sm font-semibold text-slate-950">
                                After creation
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm leading-6 text-slate-600">
                            The customer opens on a detail page, appears in the
                            Overview booking request form, and starts with an
                            empty reservation history.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppShell>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">
                {label}
            </span>
            {children}
            {error ? (
                <span className="text-xs text-rose-600">{error}</span>
            ) : null}
        </label>
    );
}
