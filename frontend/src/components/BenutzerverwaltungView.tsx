import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Users, Shield, UserCheck, UserX, Loader2, UserPlus, Copy, Check, ExternalLink, Mail } from 'lucide-react';
import { useGetAllBenutzer, useRolleZuweisen, useBenutzerDeaktivieren, useGenerateInviteCode, useGetInviteCodes } from '../hooks/useQueries';
import { UserRole } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import type { UserProfile } from '../backend';
import { toast } from 'sonner';

export default function BenutzerverwaltungView() {
  const { data: benutzer, isLoading } = useGetAllBenutzer();
  const { data: inviteCodes, isLoading: inviteCodesLoading } = useGetInviteCodes();
  const rolleZuweisen = useRolleZuweisen();
  const benutzerDeaktivieren = useBenutzerDeaktivieren();
  const generateInviteCode = useGenerateInviteCode();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'role' | 'deactivate';
    user: Principal | null;
    userName: string;
    newRole?: UserRole;
  }>({
    open: false,
    type: 'role',
    user: null,
    userName: '',
  });

  const [inviteDialog, setInviteDialog] = useState<{
    open: boolean;
    code: string | null;
  }>({
    open: false,
    code: null,
  });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleRoleChange = (user: Principal, userName: string, newRole: UserRole) => {
    setConfirmDialog({
      open: true,
      type: 'role',
      user,
      userName,
      newRole,
    });
  };

  const handleDeactivate = (user: Principal, userName: string) => {
    setConfirmDialog({
      open: true,
      type: 'deactivate',
      user,
      userName,
    });
  };

  const confirmAction = async () => {
    if (!confirmDialog.user) return;

    try {
      if (confirmDialog.type === 'role' && confirmDialog.newRole) {
        await rolleZuweisen.mutateAsync({
          user: confirmDialog.user,
          rolle: confirmDialog.newRole,
        });
        toast.success('Rolle erfolgreich geändert', {
          description: `${confirmDialog.userName} wurde die Rolle ${getRoleLabel(confirmDialog.newRole)} zugewiesen.`,
        });
      } else if (confirmDialog.type === 'deactivate') {
        await benutzerDeaktivieren.mutateAsync(confirmDialog.user);
        toast.success('Benutzer deaktiviert', {
          description: `${confirmDialog.userName} wurde erfolgreich deaktiviert.`,
        });
      }
    } catch (error: any) {
      toast.error('Fehler', {
        description: error.message || 'Ein Fehler ist aufgetreten.',
      });
    } finally {
      setConfirmDialog({ open: false, type: 'role', user: null, userName: '' });
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const code = await generateInviteCode.mutateAsync();
      setInviteDialog({ open: true, code });
      toast.success('Einladungscode erstellt', {
        description: 'Der Einladungscode wurde erfolgreich generiert.',
      });
    } catch (error: any) {
      toast.error('Fehler', {
        description: error.message || 'Fehler beim Erstellen des Einladungscodes.',
      });
    }
  };

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(text);
        setTimeout(() => setCopiedCode(null), 2000);
      } else {
        setCopiedLink(text);
        setTimeout(() => setCopiedLink(null), 2000);
      }
      toast.success('Kopiert!', {
        description: type === 'code' ? 'Einladungscode wurde kopiert.' : 'Einladungslink wurde kopiert.',
      });
    } catch (error) {
      toast.error('Fehler', {
        description: 'Konnte nicht in die Zwischenablage kopieren.',
      });
    }
  };

  const getInviteLink = (code: string): string => {
    return `${window.location.origin}?invite=${code}`;
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRole.admin:
        return 'Admin';
      case UserRole.user:
        return 'Benutzer';
      case UserRole.guest:
        return 'Gast';
      default:
        return 'Unbekannt';
    }
  };

  const getRoleBadgeVariant = (role: UserRole): 'default' | 'secondary' | 'destructive' => {
    switch (role) {
      case UserRole.admin:
        return 'destructive';
      case UserRole.user:
        return 'default';
      case UserRole.guest:
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp / BigInt(1000000)));
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Management Card */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Benutzerverwaltung</CardTitle>
                <CardDescription className="text-base">
                  Verwalten Sie Benutzerrollen und Zugriffsrechte
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleGenerateInvite} disabled={generateInviteCode.isPending} className="gap-2">
              {generateInviteCode.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Erstelle...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Benutzer einladen
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">E-Mail</TableHead>
                  <TableHead className="font-semibold">Rolle</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benutzer && benutzer.length > 0 ? (
                  benutzer.map(([principal, profile]) => (
                    <TableRow key={principal.toString()}>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(profile.role)} className="font-medium">
                          {profile.role === UserRole.admin && <Shield className="mr-1 h-3 w-3" />}
                          {profile.role === UserRole.user && <UserCheck className="mr-1 h-3 w-3" />}
                          {getRoleLabel(profile.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {profile.active ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20">
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-500/10 text-gray-700 dark:text-gray-400">
                            Inaktiv
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={profile.role}
                            onValueChange={(value) => handleRoleChange(principal, profile.name, value as UserRole)}
                            disabled={!profile.active}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UserRole.admin}>Admin</SelectItem>
                              <SelectItem value={UserRole.user}>Benutzer</SelectItem>
                              <SelectItem value={UserRole.guest}>Gast</SelectItem>
                            </SelectContent>
                          </Select>
                          {profile.active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivate(principal, profile.name)}
                              className="gap-1"
                            >
                              <UserX className="h-4 w-4" />
                              Deaktivieren
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Keine Benutzer gefunden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invitations Card */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Einladungen</CardTitle>
              <CardDescription className="text-base">
                Übersicht aller generierten Einladungscodes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inviteCodesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Einladungscode</TableHead>
                    <TableHead className="font-semibold">Erstellt am</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inviteCodes && inviteCodes.length > 0 ? (
                    inviteCodes.map((invite) => (
                      <TableRow key={invite.code}>
                        <TableCell className="font-mono text-sm">{invite.code}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(invite.created)}</TableCell>
                        <TableCell>
                          {invite.used ? (
                            <Badge variant="secondary" className="bg-gray-500/10 text-gray-700 dark:text-gray-400">
                              Verwendet
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20">
                              Verfügbar
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(invite.code, 'code')}
                              disabled={invite.used}
                              className="gap-1"
                            >
                              {copiedCode === invite.code ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Kopiert
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Code
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(getInviteLink(invite.code), 'link')}
                              disabled={invite.used}
                              className="gap-1"
                            >
                              {copiedLink === getInviteLink(invite.code) ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Kopiert
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4" />
                                  Link
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Keine Einladungen gefunden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Code Dialog */}
      <Dialog open={inviteDialog.open} onOpenChange={(open) => setInviteDialog({ ...inviteDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Einladungscode erstellt</DialogTitle>
            <DialogDescription>
              Teilen Sie diesen Code oder Link mit dem neuen Benutzer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Einladungscode</label>
              <div className="flex gap-2">
                <Input value={inviteDialog.code || ''} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => inviteDialog.code && copyToClipboard(inviteDialog.code, 'code')}
                >
                  {copiedCode === inviteDialog.code ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Einladungslink</label>
              <div className="flex gap-2">
                <Input
                  value={inviteDialog.code ? getInviteLink(inviteDialog.code) : ''}
                  readOnly
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => inviteDialog.code && copyToClipboard(getInviteLink(inviteDialog.code), 'link')}
                >
                  {copiedLink === (inviteDialog.code ? getInviteLink(inviteDialog.code) : '') ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Der Benutzer kann diesen Link verwenden, um sich zu registrieren. Der Code kann nur einmal verwendet werden.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'role' ? 'Rolle ändern?' : 'Benutzer deaktivieren?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'role' ? (
                <>
                  Möchten Sie die Rolle von <strong>{confirmDialog.userName}</strong> wirklich auf{' '}
                  <strong>{confirmDialog.newRole && getRoleLabel(confirmDialog.newRole)}</strong> ändern?
                </>
              ) : (
                <>
                  Möchten Sie <strong>{confirmDialog.userName}</strong> wirklich deaktivieren? Der Benutzer kann sich
                  danach nicht mehr anmelden.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={confirmDialog.type === 'deactivate' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {rolleZuweisen.isPending || benutzerDeaktivieren.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                'Bestätigen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
