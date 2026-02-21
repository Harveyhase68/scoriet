import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { PickList } from 'primereact/picklist';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import ProjectUnlockModal from '@/Components/Modals/ProjectUnlockModal';
import PlanModal from '@/Components/AuthModals/PlanModal';
import { useTheme } from '@/contexts/ThemeContext';

interface ProjectWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdProjectId: number) => void;
}

interface Language {
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
}

interface FloatingSchema {
  id: number;
  name: string;
  description?: string;
  visibility: string;
  owner_id?: number;
}

interface Template {
  id: number;
  name: string;
  description?: string;
  visibility: string;
  creator_user_id?: number;
}

export default function ProjectWizardModal({ isOpen, onClose, onSuccess }: ProjectWizardModalProps) {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t: t } = useTranslation(currentLanguage);
  const { colors } = useTheme();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Project Creation
  const [projectName, setProjectName] = useState('');
  const [projectNameError, setProjectNameError] = useState<string | null>(null);
  const [projectDescription, setProjectDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowJoinRequests, setAllowJoinRequests] = useState(false);
  const [projectNameExists, setProjectNameExists] = useState(false);
  const [checkingProjectName, setCheckingProjectName] = useState(false);

  // Handler for project name - only allow lowercase, numbers, underscores
  const handleProjectNameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (value !== sanitized) {
      setProjectNameError(t.projectwizardmodal65);
    } else {
      setProjectNameError(null);
    }
    setProjectName(sanitized);
  };

  // Step 2: Project Properties
  const [projectDirectory, setProjectDirectory] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [startPage, setStartPage] = useState('index.php');
  const [defaultLanguage, _setDefaultLanguage] = useState('en');
  const [filenameShortLength, setFilenameShortLength] = useState(2);

  // Step 3: Database Connection
  const [databaseServer, setDatabaseServer] = useState('127.0.0.1');
  const [databasePort, setDatabasePort] = useState('3306');
  const [databaseUsername, setDatabaseUsername] = useState('');
  const [databasePassword, setDatabasePassword] = useState('');
  const [databaseType, setDatabaseType] = useState('MySQL');

  // Step 4: Languages
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);

  // Step 5: Database Selection (existing or new)
  const [databaseOption, setDatabaseOption] = useState<'existing' | 'new'>('new');
  const [existingSchemas, setExistingSchemas] = useState<FloatingSchema[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(null);

  // Step 6: New Database Creation
  const [schemaName, setSchemaName] = useState('');
  const [schemaDescription, setSchemaDescription] = useState('');
  const [schemaVisibility, setSchemaVisibility] = useState<'public' | 'private'>('public');
  const [schemaNameExists, setSchemaNameExists] = useState(false);
  const [checkingSchemaName, setCheckingSchemaName] = useState(false);

  // Step 7: SQL Import
  const [sqlScript, setSqlScript] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [skipSqlImport, setSkipSqlImport] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Step 9: Team Selection (new/existing/skip)
  const [teamOption, setTeamOption] = useState<'new' | 'existing' | 'skip'>('skip');
  const [existingTeams, setExistingTeams] = useState<Array<{ id: number; name: string; description?: string }>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Step 10: Team Unlock (for free users)
  const [needsTeamUnlock, setNeedsTeamUnlock] = useState(false);
  const [teamUnlockConfirmed, setTeamUnlockConfirmed] = useState(false);

  // Step 11: New Team Details
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamNameExists, setTeamNameExists] = useState(false);
  const [checkingTeamName, setCheckingTeamName] = useState(false);

  // Team subscription info
  const [teamSubscriptionInfo, setTeamSubscriptionInfo] = useState<{
    active_subscriptions: number;
    owned_teams: number;
    max_allowed: number;
    needs_unlock: boolean;
  } | null>(null);

  // Step 9: Template Selection
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'private' | 'public' | 'system'>('all');

  // Wizard preferences
  const [showWizardOnStart, setShowWizardOnStart] = useState<boolean>(() => {
    const saved = localStorage.getItem('scoriet_show_wizard_on_start');
    return saved !== 'false';
  });

  // Project unlock and plan modals
  const [showProjectUnlockModal, setShowProjectUnlockModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalInitialTab, setPlanModalInitialTab] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showActualWizard, setShowActualWizard] = useState(false);
  const [_isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [_userSchemaCount, setUserSchemaCount] = useState(0);

  // Project unlock tracking (Step 0)
  const [needsProjectUnlock, setNeedsProjectUnlock] = useState(false);
  const [_projectUnlockConfirmed, setProjectUnlockConfirmed] = useState(false);

  // Database unlock tracking (Step 6)
  const [needsDatabaseUnlock, setNeedsDatabaseUnlock] = useState(false);
  const [databaseUnlockConfirmed, setDatabaseUnlockConfirmed] = useState(false);

  // Schema count for database unlock check

  // Reserved credits tracking - these will be deducted when project is created
  // This helps show the user their "effective" credit balance throughout the wizard
  const [reservedCreditsForProject, setReservedCreditsForProject] = useState(0);
  const [reservedCreditsForDatabase, setReservedCreditsForDatabase] = useState(0);
  const [reservedCreditsForTeam, setReservedCreditsForTeam] = useState(0);

  // Subscription info from API (for showing accurate limits in UI)
  const [projectSubscriptionInfo, setProjectSubscriptionInfo] = useState<{
    active_subscriptions: number;
    owned_projects: number;
    max_allowed: number;
    needs_unlock: boolean;
  } | null>(null);

  // Calculate effective credits (what the user will have after all reserved deductions)

  // Steps: 0 (project unlock, optional) + 1-12 (regular steps)
  // If project unlock needed, we start at step 0, otherwise step 1
  const totalSteps = 12;

  // Load languages
  const loadLanguages = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/active-languages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableLanguages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(t.projectwizardmodal199, err);
    }
  }, []);

  // Load existing schemas
  const loadExistingSchemas = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/schemas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { schemas: [...], subscription_info: {...} } now
        const schemas = Array.isArray(data) ? data : (data.schemas || []);
        setExistingSchemas(schemas);
      }
    } catch (err) {
      console.error(t.projectwizardmodal223, err);
    }
  }, []);

  // Refresh user credits (call after Buy Credits or when entering Step 6)
  const refreshCredits = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser((prev: any) => ({ ...prev, credits: userData.credits }));
      }
    } catch (err) {
      console.error(t.projectwizardmodal245, err);
    }
  }, []);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(t.projectwizardmodal267, err);
    }
  }, []);

  // Load existing teams
  const loadExistingTeams = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/teams?all=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Combine owned and member teams
        const allTeams = [
          ...(data.owned_teams || []),
          ...(data.member_teams || [])
        ];
        setExistingTeams(allTeams);

        // Store subscription info
        if (data.subscription_info) {
          setTeamSubscriptionInfo(data.subscription_info);
        }
      }
    } catch (err) {
      console.error(t.projectwizardmodal299, err);
    }
  }, []);

  // Check access BEFORE opening wizard
  useEffect(() => {
    const checkAccessAndOpen = async () => {
      if (!isOpen) {
        setShowActualWizard(false);
        setShowProjectUnlockModal(false);
        return;
      }

      setIsCheckingAccess(true);

      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) {
          setShowActualWizard(true);
          setIsCheckingAccess(false);
          return;
        }

        // Load user data
        const userResponse = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!userResponse.ok) {
          setShowActualWizard(true);
          setIsCheckingAccess(false);
          return;
        }

        const userData = await userResponse.json();
        setCurrentUser(userData);

        const isFreeUser = userData.user_type === 'free' || !userData.user_type;

        // Load user's schema count for database unlock check later
        if (isFreeUser) {
          try {
            const schemasResponse = await fetch('/api/schemas', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });

            if (schemasResponse.ok) {
              const schemasData = await schemasResponse.json();
              const schemas = Array.isArray(schemasData) ? schemasData : [];
              const userOwnedSchemas = schemas.filter((s: any) => s.owner_id === userData.id);
              setUserSchemaCount(userOwnedSchemas.length);
            }
          } catch (err) {
            console.error(t.projectwizardmodal358, err);
            setUserSchemaCount(0);
          }
        }

        // If user is Free, check project subscription info
        if (isFreeUser) {
          const projectsResponse = await fetch('/api/projects', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });

          if (projectsResponse.ok) {
            const data = await projectsResponse.json();
            const subscriptionInfo = data.subscription_info;

            // Store subscription info for UI display
            if (subscriptionInfo) {
              setProjectSubscriptionInfo(subscriptionInfo);
            }

            // Use subscription_info.needs_unlock to determine if user needs to pay
            // needs_unlock = true when: owned_projects >= max_allowed (1 free + active subscriptions)
            if (subscriptionInfo && subscriptionInfo.needs_unlock) {
              // Start wizard at Step 0 (Project Unlock Screen)
              setNeedsProjectUnlock(true);
              setProjectUnlockConfirmed(false);
              setCurrentStep(0);
              setShowActualWizard(true);
              setIsCheckingAccess(false);
              return;
            }
          }
        }

        // User is not Free, or has no projects yet -> show wizard directly at Step 1
        setNeedsProjectUnlock(false);
        setCurrentStep(1);
        setShowActualWizard(true);
        setIsCheckingAccess(false);

      } catch (error) {
        console.error(t.projectwizardmodal402, error);
        // On error, show wizard anyway at Step 1
        setNeedsProjectUnlock(false);
        setCurrentStep(1);
        setShowActualWizard(true);
        setIsCheckingAccess(false);
      }
    };

    checkAccessAndOpen();
  }, [isOpen]);

  useEffect(() => {
    if (showActualWizard) {
      loadLanguages();
      loadExistingSchemas();
      loadTemplates();
      loadExistingTeams();
    }
  }, [showActualWizard, loadLanguages, loadExistingSchemas, loadTemplates, loadExistingTeams]);

  // Reload schemas when reaching Step 5 to ensure fresh data
  useEffect(() => {
    if (currentStep === 5 && showActualWizard) {
      loadExistingSchemas();
    }
  }, [currentStep, showActualWizard, loadExistingSchemas]);

  // Refresh credits when entering Step 0 (Project Unlock)
  useEffect(() => {
    if (currentStep === 0 && showActualWizard) {
      refreshCredits();
    }
  }, [currentStep, showActualWizard, refreshCredits]);


  // Check if project name already exists (with debounce)
  useEffect(() => {
    if (!projectName.trim()) {
      setProjectNameExists(false);
      return;
    }

    // Debounce the check
    const timeoutId = setTimeout(async () => {
      setCheckingProjectName(true);
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // API returns { projects: [...], current_project: ..., total_projects: ... }
          const projects = data.projects || data;
          const exists = Array.isArray(projects) && projects.some((p: any) => p.name.toLowerCase() === projectName.toLowerCase());
          setProjectNameExists(exists);
        }
      } catch (err) {
        console.error(t.projectwizardmodal467, err);
      } finally {
        setCheckingProjectName(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [projectName]);

  // Check if schema name already exists (with debounce)
  useEffect(() => {
    if (!schemaName.trim()) {
      setSchemaNameExists(false);
      return;
    }

    // Debounce the check
    const timeoutId = setTimeout(async () => {
      setCheckingSchemaName(true);
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch('/api/schemas', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // API returns { schemas: [...], subscription_info: {...} }
          const schemas = Array.isArray(data) ? data : (data.schemas || []);
          const exists = schemas.some((s: any) => s.name.toLowerCase() === schemaName.toLowerCase());
          setSchemaNameExists(exists);
        }
      } catch (err) {
        console.error(t.projectwizardmodal505, err);
      } finally {
        setCheckingSchemaName(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [schemaName]);

  // Check if team name already exists (with debounce)
  useEffect(() => {
    if (!teamName.trim() || teamOption !== 'new') {
      setTeamNameExists(false);
      return;
    }

    // Debounce the check
    const timeoutId = setTimeout(async () => {
      setCheckingTeamName(true);
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch('/api/teams', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const teams = Array.isArray(data) ? data : (data.teams || []);
          const exists = teams.some((t: any) => t.name.toLowerCase() === teamName.toLowerCase());
          setTeamNameExists(exists);
        }
      } catch (err) {
        console.error(t.projectwizardmodal542, err);
      } finally {
        setCheckingTeamName(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [teamName, teamOption]);

  const handleNext = async () => {
    setError(null);

    // Validation for each step
    if (currentStep === 1) {
      if (!projectName.trim()) {
        setError(t.projectwizardmodal557);
        return;
      }
      // Check snake_case format
      if (!/^[a-z0-9]+(_[a-z0-9]+)*$/.test(projectName)) {
        setError(t.projectwizardmodal562);
        return;
      }
      // Check if name already exists
      if (projectNameExists) {
        setError(t.projectwizardmodal567);
        return;
      }
    }

    // Step 5: Database Selection - Check if unlock is needed
    if (currentStep === 5) {
      if (databaseOption === 'existing' && !selectedSchemaId) {
        setError(t.projectwizardmodal575);
        return;
      }

      // Check if user needs database unlock
      const isFreeUser = currentUser?.user_type === 'free' || !currentUser?.user_type;
      if (databaseOption === 'new' && isFreeUser) {
        // Get subscription info from API
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token) {
          try {
            const schemasResponse = await fetch('/api/schemas', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });

            if (schemasResponse.ok) {
              const schemasData = await schemasResponse.json();
              const subscriptionInfo = schemasData.subscription_info;

              if (subscriptionInfo && subscriptionInfo.needs_unlock) {
                // User needs to unlock database - Step 6 will show unlock screen
                setNeedsDatabaseUnlock(true);
                setDatabaseUnlockConfirmed(false);
                // Refresh credits before showing Step 6
                await refreshCredits();
                // Continue to Step 6 (unlock screen)
                setCurrentStep(6);
                return;
              }
            }
          } catch (err) {
            console.error(t.projectwizardmodal609, err);
          }
        }
      }

      // No unlock needed - skip Step 6 (unlock screen)
      setNeedsDatabaseUnlock(false);
      if (databaseOption === 'existing') {
        // Skip database details step (Step 7) and go to Step 8 (SQL Import)
        setCurrentStep(8);
      } else {
        // Go to Step 7 (Database Details)
        setCurrentStep(7);
      }
      return;
    }

    // Step 6: Database Unlock - handled via button click (handleStep6UnlockConfirm)
    // No validation needed here - user must click unlock button

    // Step 7: Database Details validation
    if (currentStep === 7) {
      if (!schemaName.trim()) {
        setError(t.projectwizardmodal632);
        return;
      }
      if (schemaNameExists) {
        setError(t.projectwizardmodal636);
        return;
      }
      if (checkingSchemaName) {
        setError(t.projectwizardmodal640);
        return;
      }
    }

    // Step 8: SQL Import - optional, but validate if provided
    if (currentStep === 8 && databaseOption === 'new' && !skipSqlImport && sqlScript.trim()) {
      const sqlUpper = sqlScript.toUpperCase();
      if (!sqlUpper.includes('CREATE TABLE')) {
        setError(t.projectwizardmodal649);
        return;
      }
    }

    // Step 9: Team Selection - determine next step based on selection
    if (currentStep === 9) {
      if (teamOption === 'skip') {
        // Skip directly to templates (Step 12)
        setCurrentStep(12);
        return;
      }
      if (teamOption === 'existing') {
        if (!selectedTeamId) {
          setError(t.projectwizardmodal663);
          return;
        }
        // Skip to templates (Step 12)
        setCurrentStep(12);
        return;
      }
      if (teamOption === 'new') {
        // Check if user needs team unlock
        const isFreeUser = currentUser?.user_type === 'free' || !currentUser?.user_type;
        if (isFreeUser && teamSubscriptionInfo?.needs_unlock) {
          // User needs to unlock team - go to Step 10
          setNeedsTeamUnlock(true);
          setTeamUnlockConfirmed(false);
          await refreshCredits();
          setCurrentStep(10);
          return;
        }
        // No unlock needed - go directly to team details (Step 11)
        setNeedsTeamUnlock(false);
        setCurrentStep(11);
        return;
      }
    }

    // Step 10: Team Unlock - handled via button click (handleStep10TeamUnlockConfirm)
    // No validation needed here - user must click unlock button

    // Step 11: Team Details validation
    if (currentStep === 11) {
      if (!teamName.trim()) {
        setError(t.projectwizardmodal694);
        return;
      }
      if (teamNameExists) {
        setError(t.projectwizardmodal698);
        return;
      }
      if (checkingTeamName) {
        setError(t.projectwizardmodal702);
        return;
      }
    }

    // Step 12: Templates - no validation needed (optional)

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError(null);

    // If going back from step 1 to step 0 (project unlock was needed)
    if (currentStep === 1 && needsProjectUnlock) {
      // Reset project unlock confirmation and reserved credits
      setProjectUnlockConfirmed(false);
      setReservedCreditsForProject(0);
      setCurrentStep(0);
      return;
    }

    // If going back from step 6 to step 5, reset database unlock flag
    if (currentStep === 6) {
      setNeedsDatabaseUnlock(false);
      setDatabaseUnlockConfirmed(false);
      setReservedCreditsForDatabase(0);
    }

    // If going back from step 7 and database unlock was confirmed, also reset it
    if (currentStep === 7 && needsDatabaseUnlock) {
      setDatabaseUnlockConfirmed(false);
      setReservedCreditsForDatabase(0);
    }

    // Skip Step 6 when going back if unlock was not needed
    if (currentStep === 7 && !needsDatabaseUnlock) {
      setCurrentStep(5);
      return;
    }

    // Skip Step 7 and Step 6 if using existing database
    if (currentStep === 8 && databaseOption === 'existing') {
      setCurrentStep(5);
      return;
    }

    // If going back from step 10 (Team Unlock), go to step 9 and reset unlock
    if (currentStep === 10) {
      setNeedsTeamUnlock(false);
      setTeamUnlockConfirmed(false);
      setReservedCreditsForTeam(0);
      setCurrentStep(9);
      return;
    }

    // If going back from step 11 (Team Details)
    if (currentStep === 11) {
      if (needsTeamUnlock) {
        // If unlock was needed, reset and go back to step 10
        setTeamUnlockConfirmed(false);
        setReservedCreditsForTeam(0);
        setCurrentStep(10);
      } else {
        // If no unlock was needed, go back to step 9
        setCurrentStep(9);
      }
      return;
    }

    // If going back from step 12 (Templates)
    if (currentStep === 12) {
      if (teamOption === 'new') {
        // Go back to team details (Step 11)
        setCurrentStep(11);
      } else {
        // Skip or existing team - go back to step 9
        setCurrentStep(9);
      }
      return;
    }

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSqlScript(content);
      };
      reader.readAsText(file);
    }
  };

  const handleProjectUnlockConfirm = () => {
    // User confirmed they want to spend 50 credits for project
    // This is used by the old modal - keeping for backwards compatibility
    setShowProjectUnlockModal(false);
    setShowActualWizard(true);
  };

  const handleStep0UnlockConfirm = () => {
    // User confirmed they want to spend 50 credits for project (Step 0)
    setProjectUnlockConfirmed(true);
    // Reserve 50 credits for project - will be deducted when project is created
    setReservedCreditsForProject(50);
    // Proceed to Step 1 (Project Details)
    setCurrentStep(1);
  };

  const handleBuyCredits = () => {
    // Open Plan Modal on "Buy Credits" tab (tab index 1)
    setPlanModalInitialTab(1);
    setShowPlanModal(true);
  };

  const handleStep6UnlockConfirm = () => {
    // User confirmed they want to spend 50 credits for database
    setDatabaseUnlockConfirmed(true);
    // Reserve 50 credits for database - will be deducted when schema is created
    setReservedCreditsForDatabase(50);
    // Proceed to Step 7 (Database Details)
    setCurrentStep(7);
  };

  const handleStep10TeamUnlockConfirm = () => {
    // User confirmed they want to spend 50 credits for team
    setTeamUnlockConfirmed(true);
    // Reserve 50 credits for team - will be deducted when team is created
    setReservedCreditsForTeam(50);
    // Proceed to Step 11 (Team Details)
    setCurrentStep(11);
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error(t.projectwizardmodal850);
      }

      // Pre-check: Calculate total credits needed
      const totalCreditsNeeded = reservedCreditsForProject + reservedCreditsForDatabase + reservedCreditsForTeam;
      if (totalCreditsNeeded > 0) {
        // Refresh user data to get current credits
        const userCheckResponse = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (userCheckResponse.ok) {
          const userData = await userCheckResponse.json();
          if (userData.credits < totalCreditsNeeded) {
            const parts = [];
            if (reservedCreditsForProject > 0) parts.push(`${reservedCreditsForProject}${t.projectwizardmodal868}`);
            if (reservedCreditsForDatabase > 0) parts.push(`${reservedCreditsForDatabase}${t.projectwizardmodal869}`);
            if (reservedCreditsForTeam > 0) parts.push(`${reservedCreditsForTeam}${t.projectwizardmodal870}`);
            setError(`${t.projectwizardmodal871}${totalCreditsNeeded}${t.projectwizardmodal871}(${parts.join(' + ')})${t.projectwizardmodal871_2}${userData.credits}.`);
            setLoading(false);
            setPlanModalInitialTab(1);
            setShowPlanModal(true);
            return;
          }
          // Update currentUser with fresh data
          setCurrentUser(userData);
        }
      }

      // Check if project with same name already exists (from a previous failed attempt)
      const existingProjectResponse = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      let projectId: number | null = null;
      let projectAlreadyExisted = false;

      if (existingProjectResponse.ok) {
        const existingData = await existingProjectResponse.json();
        const existingProjects = existingData.projects || existingData;
        const existingProject = Array.isArray(existingProjects)
          ? existingProjects.find((p: any) => p.name.toLowerCase() === projectName.toLowerCase() && p.owner_id === currentUser?.id)
          : null;

        if (existingProject) {
          projectId = existingProject.id;
          projectAlreadyExisted = true;
        }
      }

      // Step 1: Create Project (only if not already exists)
      if (!projectId) {
        const projectPayload = {
          name: projectName,
          description: projectDescription,
          is_public: isPublic,
          allow_join_requests: allowJoinRequests,
          project_directory: projectDirectory,
          project_url: projectUrl,
          start_page: startPage,
          default_language: defaultLanguage,
          filename_short_length: filenameShortLength,
          database_server: databaseServer,
          database_port: databasePort,
          database_username: databaseUsername,
          database_password: databasePassword,
          database_type: databaseType,
        };

        const projectResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(projectPayload),
        });

        if (!projectResponse.ok) {
          const errorData = await projectResponse.json();

          // Handle insufficient credits error
          if (errorData.error_code === 'INSUFFICIENT_CREDITS') {
            setError(`${t.projectwizardmodal940}${errorData.required_credits}${t.projectwizardmodal940_2}${errorData.current_credits}.`);
            setLoading(false);
            setPlanModalInitialTab(1);
            setShowPlanModal(true);
            return;
          }

          throw new Error(errorData.message || t.projectwizardmodal947);
        }

        const project = await projectResponse.json();
        projectId = project.id;
      }

      // Step 2: Update language settings
      await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          enabled_languages: selectedLanguages,
          default_language: defaultLanguage,
        }),
      });

      // Step 3: Handle Database/Schema
      let schemaId = selectedSchemaId;

      if (databaseOption === 'new') {
        // Check if project already has a schema linked (from previous attempt)
        if (projectAlreadyExisted) {
          try {
            const projectSchemasResponse = await fetch(`/api/projects/${projectId}/schemas`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
            });

            if (projectSchemasResponse.ok) {
              const projectSchemas = await projectSchemasResponse.json();
              const existingSchema = Array.isArray(projectSchemas)
                ? projectSchemas.find((s: any) => s.name?.toLowerCase() === schemaName.toLowerCase())
                : null;

              if (existingSchema) {
                schemaId = existingSchema.id;
              }
            }
          } catch {
            // Could not check existing schemas, will create new one
          }
        }

        // Create new schema only if we don't have one
        if (!schemaId) {
          const schemaResponse = await fetch('/api/schemas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              name: schemaName,
              description: schemaDescription,
              visibility: schemaVisibility,
            }),
          });

          if (!schemaResponse.ok) {
            const errorData = await schemaResponse.json().catch(() => ({}));

            // Handle insufficient credits error specifically
            if (errorData.error_code === 'INSUFFICIENT_CREDITS') {
              setError(`${t.projectwizardmodal1018}${errorData.required_credits || 50} Credits.`);
              setLoading(false);
              setPlanModalInitialTab(1);
              setShowPlanModal(true);
              return;
            }

            const errorMessage = errorData.message || errorData.error || t.projectwizardmodal1025;
            console.error(t.projectwizardmodal1026, errorData);
            throw new Error(`${t.projectwizardmodal1027}${errorMessage}`);
          }

          const schema = await schemaResponse.json();
          schemaId = schema.id;
        }
      }

      // Step 4: Associate schema with project (BEFORE SQL import!)
      if (schemaId) {
        const associateResponse = await fetch(`/api/projects/${projectId}/schemas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            schema_id: schemaId,
            association_type: 'linked',
            alias: null,
          }),
        });

        if (!associateResponse.ok) {
          const errorData = await associateResponse.json().catch(() => ({}));
          throw new Error(`${t.projectwizardmodal1053}${errorData.message || errorData.error || t.projectwizardmodal1053_2}`);
        }
      }

      // Step 5: Handle team (optional)
      if (teamOption === 'new' && teamName.trim()) {
        // Create new team
        const teamResponse = await fetch('/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: teamName,
            description: teamDescription,
            project_ids: projectId ? [projectId] : [],
          }),
        });

        if (!teamResponse.ok) {
          const errorData = await teamResponse.json().catch(() => ({}));

          // Handle insufficient credits error
          if (errorData.error_code === 'INSUFFICIENT_CREDITS') {
            setError(`${t.projectwizardmodal1079}${errorData.required_credits || 50} Credits.`);
            setLoading(false);
            setPlanModalInitialTab(1);
            setShowPlanModal(true);
            return;
          }

          // Non-critical error - warn but continue
          alert(`${t.projectwizardmodal1087}\n\n${errorData.message || t.projectwizardmodal1087_2}\n\n${t.projectwizardmodal1087_3}`);
        }
      } else if (teamOption === 'existing' && selectedTeamId && projectId) {
        // Assign existing team to project
        try {
          await fetch(`/api/teams/${selectedTeamId}/projects`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              project_ids: [projectId],
            }),
          });
        } catch {
          // Non-critical error - team linking failed but project is created
        }
      }

      // Step 6: Assign templates
      // The API expects: POST /api/templates/{templateId}/link with project_ids array
      for (const templateId of selectedTemplates) {
        try {
          const linkResponse = await fetch(`/api/templates/${templateId}/link`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              project_ids: [projectId],
            }),
          });

          if (!linkResponse.ok) {
            // Template linking failed - non-critical, continue
          }
        } catch {
          // Error linking template - non-critical, continue
        }
      }

      // Step 7: Import SQL (LAST STEP - after everything else is set up)
      if (databaseOption === 'new' && !skipSqlImport && sqlScript.trim() && schemaId) {
        try {
          const importResponse = await fetch('/api/sql-parse-and-store', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              sql_script: sqlScript,
              schema_id: schemaId,
              description: importDescription || t.projectwizardmodal1145,
            }),
          });

          if (!importResponse.ok) {
            const errorData = await importResponse.json();

            // Show warning but don't fail the entire wizard
            alert(`${t.projectwizardmodal1153}\n\n${errorData.error || 'Unknown error'}\n\n${t.projectwizardmodal1153_2}`);
          }
        } catch {
          // Continue anyway - project is already set up
          alert(`${t.projectwizardmodal1157}\n\n${t.projectwizardmodal1157_2}`);
        }
      }

      // Reload user data to get updated credits
      const userResponse = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);
      }

      // Success!
      // Dispatch event to notify Navigation Panel to reload the tree
      window.dispatchEvent(new CustomEvent('projectChanged', { detail: { projectId } }));

      if (onSuccess && projectId) {
        onSuccess(projectId);
      }
      handleClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : t.projectwizardmodal1183);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Hide the wizard immediately
      setShowActualWizard(false);

      // Reset all state
      setCurrentStep(1);
      setError(null);
      setProjectName('');
      setProjectDescription('');
      setSqlScript('');
      // Reset unlock/reserved credits state
      setNeedsProjectUnlock(false);
      setProjectUnlockConfirmed(false);
      setNeedsDatabaseUnlock(false);
      setDatabaseUnlockConfirmed(false);
      setReservedCreditsForProject(0);
      setReservedCreditsForDatabase(0);
      // Reset other form fields
      setSchemaName('');
      setSchemaDescription('');
      setSchemaNameExists(false);
      setCheckingSchemaName(false);
      setSelectedSchemaId(null);
      setDatabaseOption('new');
      setSelectedTemplates([]);
      // Reset team state
      setTeamOption('skip');
      setSelectedTeamId(null);
      setNeedsTeamUnlock(false);
      setTeamUnlockConfirmed(false);
      setTeamName('');
      setTeamDescription('');
      setTeamNameExists(false);
      setCheckingTeamName(false);
      setReservedCreditsForTeam(0);
      setTeamSubscriptionInfo(null);
      setProjectSubscriptionInfo(null);

      // Notify parent component
      onClose();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: {
        // Step 0: Project Unlock Screen (only shown when project unlock is needed)
        const hasEnoughCreditsForProject = (currentUser?.credits || 0) >= 50;
        const creditsNeededForProject = 50 - (currentUser?.credits || 0);

        // Get accurate info from subscription data
        const currentProjects = projectSubscriptionInfo?.owned_projects || 0;
        const maxAllowed = projectSubscriptionInfo?.max_allowed || 1;
        const activeSubscriptions = projectSubscriptionInfo?.active_subscriptions || 0;

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              {t.projectwizardmodal1248}
            </h3>

            <div className="rounded-lg p-4" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningText}` }}>
              <p className="text-sm mb-2" style={{ color: colors.warningText }}>
                <strong>{t.projectwizardmodal1253}</strong>
              </p>
              <p className="text-sm" style={{ color: colors.textPrimary }}>
                {t.projectwizardmodal1256}<strong>{maxAllowed}{maxAllowed > 1 ? t.projectwizardmodal1256_5 : t.projectwizardmodal1256_6}</strong> ({t.projectwizardmodal1256_2}{activeSubscriptions > 0 ? ` + ${activeSubscriptions}${activeSubscriptions > 1 ? t.projectwizardmodal1256_4 : t.projectwizardmodal1256_3}` : ''})
              </p>
              <p className="text-sm" style={{ color: colors.textPrimary }}>
                {t.projectwizardmodal1259}<strong>{currentProjects}</strong>
              </p>
              <p className="text-sm mt-2" style={{ color: colors.textPrimary }}>
                {t.projectwizardmodal1262}<strong>{t.projectwizardmodal1262_2}</strong>.
              </p>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal1268}</span>
                <span className="font-bold text-lg" style={{ color: colors.textPrimary }}>{currentUser?.credits || 0}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal1272}</span>
                <span className="font-bold text-lg" style={{ color: colors.warningText }}>50</span>
              </div>
              <hr className="my-2" style={{ borderColor: colors.borderSecondary }} />
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal1277}</span>
                <span className="font-bold text-lg" style={{ color: hasEnoughCreditsForProject ? colors.successText : colors.errorText }}>
                  {hasEnoughCreditsForProject ? (currentUser?.credits || 0) - 50 : `${t.projectwizardmodal1279}${creditsNeededForProject}${t.projectwizardmodal1279_2}`}
                </span>
              </div>
            </div>

            {!hasEnoughCreditsForProject && (
              <div className="rounded-lg p-4" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}` }}>
                <p className="text-sm" style={{ color: colors.errorText }}>
                  {t.projectwizardmodal1287}<strong>{creditsNeededForProject}{t.projectwizardmodal1287_2}</strong>{t.projectwizardmodal1287_3}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {hasEnoughCreditsForProject ? (
                <Button
                  label={t.projectwizardmodal1295}
                  icon="pi pi-unlock"
                  onClick={handleStep0UnlockConfirm}
                  className="flex-1"
                  severity="success"
                />
              ) : (
                <Button
                  label={t.projectwizardmodal1303}
                  icon="pi pi-shopping-cart"
                  onClick={handleBuyCredits}
                  className="flex-1"
                  severity="warning"
                />
              )}
            </div>

            <p className="text-xs text-center" style={{ color: colors.textMuted }}>
              {t.projectwizardmodal1313}{' '}
              <button
                type="button"
                onClick={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
                className="underline font-semibold"
                style={{ color: colors.warningText }}
              >
                {t.projectwizardmodal1320}
              </button>
              {' '}{t.projectwizardmodal1322}
            </p>
          </div>
        );
      }

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1331}</h3>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1334}
              </label>
              <InputText
                value={projectName}
                onChange={(e) => handleProjectNameChange(e.target.value)}
                placeholder="my_awesome_project"
                className={`w-full ${projectNameExists || projectNameError ? 'border-red-500' : ''}`}
              />
              <div className="flex items-center gap-2 mt-1">
                {projectNameError && (
                  <small className="flex items-center gap-1" style={{ color: colors.errorText }}>
                    <i className="pi pi-exclamation-triangle"></i>
                    {projectNameError}
                  </small>
                )}
                {!projectNameError && checkingProjectName && projectName.trim() && (
                  <small className="flex items-center gap-1" style={{ color: colors.accent }}>
                    <i className="pi pi-spin pi-spinner"></i>
                    {t.projectwizardmodal1352}
                  </small>
                )}
                {!projectNameError && !checkingProjectName && projectName.trim() && projectNameExists && (
                  <small className="flex items-center gap-1" style={{ color: colors.errorText }}>
                    <i className="pi pi-times-circle"></i>
                    {t.projectwizardmodal1358}
                  </small>
                )}
                {!projectNameError && !checkingProjectName && projectName.trim() && !projectNameExists && /^[a-z0-9]+(_[a-z0-9]+)*$/.test(projectName) && (
                  <small className="flex items-center gap-1" style={{ color: colors.successText }}>
                    <i className="pi pi-check-circle"></i>
                    {t.projectwizardmodal1364}
                  </small>
                )}
              </div>
              <small className="block mt-1" style={{ color: colors.textMuted }}>{t.projectwizardmodal1368}</small>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1372}
              </label>
              <InputTextarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
                placeholder={t.projectwizardmodal1378}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Checkbox
                  inputId="is_public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.checked || false)}
                />
                <label htmlFor="is_public" className="ml-2" style={{ color: colors.textSecondary }}>{t.projectwizardmodal1389}</label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  inputId="allow_join"
                  checked={allowJoinRequests}
                  onChange={(e) => setAllowJoinRequests(e.checked || false)}
                />
                <label htmlFor="allow_join" className="ml-2" style={{ color: colors.textSecondary }}>{t.projectwizardmodal1397}</label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1406}</h3>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1409}
              </label>
              <InputText
                value={projectDirectory}
                onChange={(e) => setProjectDirectory(e.target.value)}
                placeholder="C:\Users\Public\Documents\my_project"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1420}
              </label>
              <InputText
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="http://localhost/my_project"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.projectwizardmodal1432}
                </label>
                <InputText
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  placeholder="index.php"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.projectwizardmodal1443}
                </label>
                <Dropdown
                  value={filenameShortLength}
                  onChange={(e) => setFilenameShortLength(e.value)}
                  options={[
                    { label: t.projectwizardmodal1449, value: 2 },
                    { label: t.projectwizardmodal1450, value: 3 },
                    { label: t.projectwizardmodal1451, value: 4 },
                    { label: t.projectwizardmodal1452, value: 5 },
                  ]}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1464}</h3>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1467}
              </label>
              <Dropdown
                value={databaseType}
                onChange={(e) => setDatabaseType(e.value)}
                options={[
                  { label: 'MySQL', value: 'MySQL' },
                  { label: 'PostgreSQL', value: 'PostgreSQL' },
                  { label: 'SQLite', value: 'SQLite' },
                  { label: 'SQL Server', value: 'MSSQL' },
                ]}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.projectwizardmodal1484}
                </label>
                <InputText
                  value={databaseServer}
                  onChange={(e) => setDatabaseServer(e.target.value)}
                  placeholder="127.0.0.1"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.projectwizardmodal1495}
                </label>
                <InputText
                  value={databasePort}
                  onChange={(e) => setDatabasePort(e.target.value)}
                  placeholder="3306"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1507}
              </label>
              <InputText
                value={databaseUsername}
                onChange={(e) => setDatabaseUsername(e.target.value)}
                placeholder="database_user"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1518}
              </label>
              <InputText
                type="password"
                value={databasePassword}
                onChange={(e) => setDatabasePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
              />
            </div>
          </div>
        );

      case 4: {
        // Build source and target arrays with proper ordering
        const sourceLanguages = availableLanguages.filter(lang => !selectedLanguages.includes(lang.code));
        const targetLanguages = selectedLanguages
          .map(code => availableLanguages.find(lang => lang.code === code))
          .filter(lang => lang !== undefined) as Language[];

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1540}</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {t.projectwizardmodal1542}
            </p>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              {t.projectwizardmodal1545}
            </p>
            <PickList
              source={sourceLanguages}
              target={targetLanguages}
              dataKey="code"
              onChange={(e) => {
                // Maintain the order of target languages
                const targetCodes = e.target.map((item: Language) => item.code);
                setSelectedLanguages(targetCodes);
              }}
              itemTemplate={(item: Language) => `${item.native_name} (${item.name})`}
              sourceHeader={t.projectwizardmodal1556}
              targetHeader={t.projectwizardmodal1557}
              sourceStyle={{ height: '300px' }}
              targetStyle={{ height: '300px' }}
              showSourceControls={false}
              showTargetControls={true}
            />
          </div>
        );
      }

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1571}</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="new_db"
                  checked={databaseOption === 'new'}
                  onChange={() => setDatabaseOption('new')}
                  className="mr-2"
                />
                <label htmlFor="new_db" style={{ color: colors.textSecondary }}>{t.projectwizardmodal1581}</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="existing_db"
                  checked={databaseOption === 'existing'}
                  onChange={() => setDatabaseOption('existing')}
                  className="mr-2"
                />
                <label htmlFor="existing_db" style={{ color: colors.textSecondary }}>{t.projectwizardmodal1591}</label>
              </div>
            </div>

            {databaseOption === 'existing' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.projectwizardmodal1597}
                </label>
                <Dropdown
                  value={selectedSchemaId}
                  onChange={(e) => setSelectedSchemaId(e.value)}
                  options={existingSchemas.map(s => ({ label: s.name, value: s.id }))}
                  placeholder={t.projectwizardmodal1603}
                  className="w-full"
                />
              </div>
            )}
          </div>
        );

      case 6: {
        // Step 6: Database Unlock Screen (only shown when unlock is needed)
        // Use effective credits (actual - reserved for project) to check if user has enough
        const availableCreditsForDb = (currentUser?.credits || 0) - reservedCreditsForProject;
        const hasEnoughCreditsForDb = availableCreditsForDb >= 50;
        const creditsNeededForDb = 50 - availableCreditsForDb;

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              {t.projectwizardmodal1621}
            </h3>

            <div className="rounded-lg p-4" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningText}` }}>
              <p className="text-sm mb-2" style={{ color: colors.warningText }}>
                <strong>{t.projectwizardmodal1626}</strong>
              </p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1629}<strong>{t.projectwizardmodal1629_2}</strong>{t.projectwizardmodal1629_3}<strong>{t.projectwizardmodal1629_5}</strong>.
              </p>
              <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1632_2}<strong>{t.projectwizardmodal1632_3}</strong>.
              </p>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal1638}</span>
                <span className="font-bold text-lg" style={{ color: colors.textPrimary }}>{currentUser?.credits || 0}</span>
              </div>
              {reservedCreditsForProject > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal1643}</span>
                  <span className="font-bold text-lg" style={{ color: colors.warningText }}>-{reservedCreditsForProject}</span>
                </div>
              )}
              {reservedCreditsForProject > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal1649}</span>
                  <span className="font-bold text-lg" style={{ color: colors.textPrimary }}>{availableCreditsForDb}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal1654}</span>
                <span className="font-bold text-lg" style={{ color: colors.warningText }}>50</span>
              </div>
              <hr className="my-2" style={{ borderColor: colors.borderSecondary }} />
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal1659}</span>
                <span className="font-bold text-lg" style={{ color: hasEnoughCreditsForDb ? colors.successText : colors.errorText }}>
                  {hasEnoughCreditsForDb ? availableCreditsForDb - 50 : `${t.projectwizardmodal1662}${creditsNeededForDb}${t.projectwizardmodal1662_2}`}
                </span>
              </div>
            </div>

            {!hasEnoughCreditsForDb && (
              <div className="rounded-lg p-4" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}` }}>
                <p className="text-sm" style={{ color: colors.errorText }}>
                  {t.projectwizardmodal1669}<strong>{creditsNeededForDb}{t.projectwizardmodal1669_2}</strong>{t.projectwizardmodal1669_3}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {hasEnoughCreditsForDb ? (
                <Button
                  label={t.projectwizardmodal1678}
                  icon="pi pi-unlock"
                  onClick={handleStep6UnlockConfirm}
                  className="flex-1"
                  severity="success"
                />
              ) : (
                <Button
                  label={t.projectwizardmodal1686}
                  icon="pi pi-shopping-cart"
                  onClick={handleBuyCredits}
                  className="flex-1"
                  severity="warning"
                />
              )}
            </div>

            <p className="text-xs text-center" style={{ color: colors.textMuted }}>
              {t.projectwizardmodal1696}{' '}
              <button
                type="button"
                onClick={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
                className="underline font-semibold"
                style={{ color: colors.warningText }}
              >
                {t.projectwizardmodal1703}
              </button>
              {' '}{t.projectwizardmodal1705}
            </p>
          </div>
        );
      }

      case 7:
        // Step 7: Database Details (only shown when creating new database)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1715}</h3>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1718}
              </label>
              <InputText
                value={schemaName}
                onChange={(e) => {
                  // Sanitize: only allow lowercase letters, numbers, and underscores
                  const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setSchemaName(sanitized);
                }}
                placeholder="my_database"
                className={`w-full ${schemaNameExists ? 'border-red-500' : ''}`}
              />
              <div className="flex items-center gap-2 mt-1">
                {checkingSchemaName && schemaName.trim() && (
                  <small className="flex items-center gap-1" style={{ color: colors.accent }}>
                    <i className="pi pi-spin pi-spinner"></i>
                    {t.projectwizardmodal1730}
                  </small>
                )}
                {!checkingSchemaName && schemaName.trim() && schemaNameExists && (
                  <small className="flex items-center gap-1" style={{ color: colors.errorText }}>
                    <i className="pi pi-times-circle"></i>
                    {t.projectwizardmodal1736}
                  </small>
                )}
                {!checkingSchemaName && schemaName.trim() && !schemaNameExists && (
                  <small className="flex items-center gap-1" style={{ color: colors.successText }}>
                    <i className="pi pi-check-circle"></i>
                    {t.projectwizardmodal1742}
                  </small>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1749}
              </label>
              <InputTextarea
                value={schemaDescription}
                onChange={(e) => setSchemaDescription(e.target.value)}
                rows={3}
                placeholder={t.projectwizardmodal1755}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1761}
              </label>
              <Dropdown
                value={schemaVisibility}
                onChange={(e) => setSchemaVisibility(e.value)}
                options={[
                  { label: t.projectwizardmodal1767, value: 'public' },
                  { label: t.projectwizardmodal1768, value: 'private' },
                ]}
                className="w-full"
              />
            </div>
          </div>
        );

      case 8:
        // Step 8: SQL Import (only shown when creating new database)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1780}</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {t.projectwizardmodal1782}
            </p>

            {/* Skip SQL Import Checkbox */}
            <div className="flex items-center p-3 rounded" style={{ backgroundColor: colors.bgTertiary }}>
              <Checkbox
                inputId="skip_sql_import"
                checked={skipSqlImport}
                onChange={(e) => {
                  setSkipSqlImport(e.checked || false);
                  if (e.checked) {
                    setSqlScript('');
                  }
                }}
              />
              <label htmlFor="skip_sql_import" className="ml-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1798}
              </label>
            </div>

            {!skipSqlImport && (
              <>
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {t.projectwizardmodal1807}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded transition-colors flex items-center gap-2"
                      style={{ backgroundColor: colors.accent, color: colors.textInverse }}
                    >
                      <i className="pi pi-upload"></i>
                      <span>{t.projectwizardmodal1824}</span>
                    </button>
                    {sqlScript && (
                      <button
                        type="button"
                        onClick={() => {
                          setSqlScript('');
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="px-4 py-2 rounded transition-colors"
                        style={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
                      >
                        {t.projectwizardmodal1838}
                      </button>
                    )}
                  </div>
                  {sqlScript && (
                    <p className="text-sm mt-2" style={{ color: colors.successText }}>
                      {t.projectwizardmodal1844}({sqlScript.length}{t.projectwizardmodal1844_2})
                    </p>
                  )}
                </div>

                {/* Paste SQL */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {t.projectwizardmodal1852}
                  </label>
                  <textarea
                    value={sqlScript}
                    onChange={(e) => setSqlScript(e.target.value)}
                    rows={10}
                    placeholder={t.projectwizardmodal1858}
                    className="w-full px-3 py-2 rounded font-mono text-sm"
                    style={{ backgroundColor: colors.bgPrimary, border: `1px solid ${colors.borderSecondary}`, color: colors.textPrimary }}
                  />
                  <small style={{ color: colors.textMuted }}>
                    {t.projectwizardmodal1863}
                  </small>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    {t.projectwizardmodal1869}
                  </label>
                  <InputText
                    value={importDescription}
                    onChange={(e) => setImportDescription(e.target.value)}
                    placeholder={t.projectwizardmodal1874}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 9:
        // Step 9: Team Selection (new/existing/skip)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1887}</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {t.projectwizardmodal1889}
            </p>

            <div className="space-y-3">
              <div className="flex items-center p-3 rounded cursor-pointer" style={{ backgroundColor: colors.bgTertiary }} onClick={() => setTeamOption('skip')}>
                <input
                  type="radio"
                  id="team_skip"
                  checked={teamOption === 'skip'}
                  onChange={() => setTeamOption('skip')}
                  className="mr-3"
                />
                <label htmlFor="team_skip" className="cursor-pointer flex-1" style={{ color: colors.textSecondary }}>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1902}</span>
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{t.projectwizardmodal1903}</p>
                </label>
              </div>

              <div className="flex items-center p-3 rounded cursor-pointer" style={{ backgroundColor: colors.bgTertiary }} onClick={() => setTeamOption('new')}>
                <input
                  type="radio"
                  id="team_new"
                  checked={teamOption === 'new'}
                  onChange={() => setTeamOption('new')}
                  className="mr-3"
                />
                <label htmlFor="team_new" className="cursor-pointer flex-1" style={{ color: colors.textSecondary }}>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1916}</span>
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{t.projectwizardmodal1917}</p>
                </label>
              </div>

              {existingTeams.length > 0 && (
                <div className="flex items-center p-3 rounded cursor-pointer" style={{ backgroundColor: colors.bgTertiary }} onClick={() => setTeamOption('existing')}>
                  <input
                    type="radio"
                    id="team_existing"
                    checked={teamOption === 'existing'}
                    onChange={() => setTeamOption('existing')}
                    className="mr-3"
                  />
                  <label htmlFor="team_existing" className="cursor-pointer flex-1" style={{ color: colors.textSecondary }}>
                    <span className="font-medium" style={{ color: colors.textPrimary }}>{t.projectwizardmodal1931}</span>
                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{t.projectwizardmodal1932}</p>
                  </label>
                </div>
              )}
            </div>

            {teamOption === 'existing' && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {t.projectwizardmodal1941}
                </label>
                <Dropdown
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.value)}
                  options={existingTeams.map(t => ({ label: t.name, value: t.id }))}
                  placeholder={t.projectwizardmodal1947}
                  className="w-full"
                />
              </div>
            )}
          </div>
        );

      case 10: {
        // Step 10: Team Unlock (only shown when creating new team and user needs unlock)
        const availableCreditsForTeam = (currentUser?.credits || 0) - reservedCreditsForProject - reservedCreditsForDatabase;
        const hasEnoughCreditsForTeam = availableCreditsForTeam >= 50;
        const creditsNeededForTeam = 50 - availableCreditsForTeam;

        // Get accurate info from subscription data
        const ownedTeams = teamSubscriptionInfo?.owned_teams || 0;
        const activeTeamSubscriptions = teamSubscriptionInfo?.active_subscriptions || 0;

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              {t.projectwizardmodal1968}
            </h3>

            <div className="rounded-lg p-4" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningText}` }}>
              <p className="text-sm mb-2" style={{ color: colors.warningText }}>
                <strong>{t.projectwizardmodal1973}</strong>
              </p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal1976}<strong>{t.projectwizardmodal1976_2}</strong>.
              </p>
              {ownedTeams > 0 && (
                <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                  {t.projectwizardmodal1980}<strong>{ownedTeams}{ownedTeams > 1 ? t.projectwizardmodal1980_1 : t.projectwizardmodal1980_2}</strong>
                  {activeTeamSubscriptions > 0 && ` (${activeTeamSubscriptions}${activeTeamSubscriptions > 1 ? t.projectwizardmodal1981 : t.projectwizardmodal1981_2})`}.
                </p>
              )}
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderSecondary}` }}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal1988}</span>
                <span className="font-bold text-lg" style={{ color: colors.textPrimary }}>{currentUser?.credits || 0}</span>
              </div>
              {(reservedCreditsForProject > 0 || reservedCreditsForDatabase > 0) && (
                <>
                  {reservedCreditsForProject > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal1995}</span>
                      <span className="font-bold text-lg" style={{ color: colors.warningText }}>-{reservedCreditsForProject}</span>
                    </div>
                  )}
                  {reservedCreditsForDatabase > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal2001}</span>
                      <span className="font-bold text-lg" style={{ color: colors.warningText }}>-{reservedCreditsForDatabase}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal2006}</span>
                    <span className="font-bold text-lg" style={{ color: colors.textPrimary }}>{availableCreditsForTeam}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal2012}</span>
                <span className="font-bold text-lg" style={{ color: colors.warningText }}>50</span>
              </div>
              <hr className="my-2" style={{ borderColor: colors.borderSecondary }} />
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textSecondary }}>{t.projectwizardmodal2017}</span>
                <span className="font-bold text-lg" style={{ color: hasEnoughCreditsForTeam ? colors.successText : colors.errorText }}>
                  {hasEnoughCreditsForTeam ? availableCreditsForTeam - 50 : `Need ${creditsNeededForTeam} more`}
                </span>
              </div>
            </div>

            {!hasEnoughCreditsForTeam && (
              <div className="rounded-lg p-4" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}` }}>
                <p className="text-sm" style={{ color: colors.errorText }}>
                  {t.projectwizardmodal2027_2}<strong>{creditsNeededForTeam}{t.projectwizardmodal2027}</strong>{t.projectwizardmodal2027_3}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {hasEnoughCreditsForTeam ? (
                <Button
                  label={t.projectwizardmodal2035}
                  icon="pi pi-unlock"
                  onClick={handleStep10TeamUnlockConfirm}
                  className="flex-1"
                  severity="success"
                />
              ) : (
                <Button
                  label={t.projectwizardmodal2043}
                  icon="pi pi-shopping-cart"
                  onClick={handleBuyCredits}
                  className="flex-1"
                  severity="warning"
                />
              )}
            </div>

            <p className="text-xs text-center" style={{ color: colors.textMuted }}>
              {t.projectwizardmodal2053}{' '}
              <button
                type="button"
                onClick={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
                className="underline font-semibold"
                style={{ color: colors.warningText }}
              >
                {t.projectwizardmodal2060}
              </button>
              {' '}{t.projectwizardmodal2062}
            </p>
          </div>
        );
      }

      case 11:
        // Step 11: Team Details (only shown when creating new team)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.projectwizardmodal2072}</h3>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal2075}
              </label>
              <InputText
                value={teamName}
                onChange={(e) => {
                  // Sanitize: only allow lowercase letters, numbers, and underscores
                  const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setTeamName(sanitized);
                }}
                placeholder="my_team"
                className={`w-full ${teamNameExists ? 'border-red-500' : ''}`}
              />
              <div className="flex items-center gap-2 mt-1">
                {checkingTeamName && teamName.trim() && (
                  <small className="flex items-center gap-1" style={{ color: colors.accent }}>
                    <i className="pi pi-spin pi-spinner"></i>
                    {t.projectwizardmodal2087}
                  </small>
                )}
                {!checkingTeamName && teamName.trim() && teamNameExists && (
                  <small className="flex items-center gap-1" style={{ color: colors.errorText }}>
                    <i className="pi pi-times-circle"></i>
                    {t.projectwizardmodal2093}
                  </small>
                )}
                {!checkingTeamName && teamName.trim() && !teamNameExists && (
                  <small className="flex items-center gap-1" style={{ color: colors.successText }}>
                    <i className="pi pi-check-circle"></i>
                    {t.projectwizardmodal2099}
                  </small>
                )}
              </div>
              <small className="block mt-1" style={{ color: colors.textMuted }}>{t.projectwizardmodal2103}</small>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal2107}
              </label>
              <InputTextarea
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                rows={3}
                placeholder={t.projectwizardmodal2113}
                className="w-full"
              />
            </div>
          </div>
        );

      case 12: {
        // Step 12: Template Selection
        const filteredTemplates = templates.filter(t => {
          if (templateFilter === 'all') return true;
          if (templateFilter === 'private') return t.visibility === 'private';
          if (templateFilter === 'public') return t.visibility === 'public' && t.creator_user_id !== null;
          if (templateFilter === 'system') return t.visibility === 'public' && t.creator_user_id === null;
          return true;
        });

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{t.projectwizardmodal2132}</h3>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                {t.projectwizardmodal2135}
              </label>
              <Dropdown
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.value)}
                options={[
                  { label: t.projectwizardmodal2141, value: 'all' },
                  { label: t.projectwizardmodal2142, value: 'private' },
                  { label: t.projectwizardmodal2143, value: 'public' },
                  { label: t.projectwizardmodal2144, value: 'system' },
                ]}
                className="w-full"
              />
            </div>

            <div className="rounded p-4 max-h-96 overflow-y-auto" style={{ border: `1px solid ${colors.borderSecondary}` }}>
              {filteredTemplates.length === 0 ? (
                <p className="text-center" style={{ color: colors.textMuted }}>{t.projectwizardmodal2152}</p>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map(template => (
                    <div key={template.id} className="flex items-start gap-3 p-2 rounded" style={{ backgroundColor: 'transparent' }}>
                      <Checkbox
                        inputId={`template_${template.id}`}
                        checked={selectedTemplates.includes(template.id)}
                        onChange={(e) => {
                          if (e.checked) {
                            setSelectedTemplates([...selectedTemplates, template.id]);
                          } else {
                            setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <label htmlFor={`template_${template.id}`} className="cursor-pointer" style={{ color: colors.textPrimary }}>
                          {template.name}
                        </label>
                        {template.description && (
                          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{template.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              {t.projectwizardmodal2182}
            </p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
    <Dialog
      header={currentStep === 0 ? t.projectwizardmodal2196 : `${t.projectwizardmodal2196_2}${currentStep} of ${totalSteps}`}
      visible={showActualWizard}
      onHide={handleClose}
      style={{ width: '60vw', maxWidth: '900px' }}
      modal
      closable={!loading}
      draggable={false}
      className="project-wizard-modal"
      contentStyle={{
        padding: '1.5rem',
        backgroundColor: colors.bgSecondary,
        color: colors.textPrimary,
        minHeight: '500px',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Progress Bar */}
        <div className="mb-6">
          {currentStep === 0 ? (
            /* Step 0: Show unlock indicator instead of normal progress */
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold" style={{ backgroundColor: colors.warningText, color: colors.textInverse }}>
                🔓
              </div>
              <span className="font-medium" style={{ color: colors.warningText }}>{t.projectwizardmodal2220}</span>
            </div>
          ) : (
            /* Steps 1-10: Normal progress bar */
            <>
              <div className="flex justify-between mb-2">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
                  <div
                    key={step}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      backgroundColor: step <= currentStep ? colors.accent : colors.bgTertiary,
                      color: step <= currentStep ? colors.textInverse : colors.textMuted
                    }}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: colors.bgTertiary }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%`, backgroundColor: colors.accent }}
                />
              </div>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorText}`, color: colors.errorText }}>
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto mb-6">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4" style={{ borderTop: `1px solid ${colors.borderSecondary}` }}>
          <Button
            label={t.projectwizardmodal2267}
            icon="pi pi-arrow-left"
            onClick={handleBack}
            disabled={currentStep === 0 || (currentStep === 1 && !needsProjectUnlock) || loading}
            severity="secondary"
          />

          {/* Show wizard on start checkbox */}
          <div className="flex items-center">
            <Checkbox
              inputId="show_wizard_on_start"
              checked={showWizardOnStart}
              onChange={(e) => {
                const newValue = e.checked || false;
                setShowWizardOnStart(newValue);
                localStorage.setItem('scoriet_show_wizard_on_start', newValue ? 'true' : 'false');
              }}
            />
            <label htmlFor="show_wizard_on_start" className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
              {t.projectwizardmodal2286}
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              label={t.projectwizardmodal2292}
              onClick={handleClose}
              disabled={loading}
              severity="secondary"
              outlined
            />
            {currentStep < totalSteps ? (
              <Button
                label={t.projectwizardmodal2300}
                icon="pi pi-arrow-right"
                iconPos="right"
                onClick={handleNext}
                disabled={
                  loading ||
                  currentStep === 0 || // Must click "Unlock Project" button on Step 0
                  (currentStep === 1 && (!projectName.trim() || projectNameExists || checkingProjectName)) ||
                  (currentStep === 6 && needsDatabaseUnlock && !databaseUnlockConfirmed) ||
                  (currentStep === 10 && needsTeamUnlock && !teamUnlockConfirmed) // Must click "Unlock Team" button on Step 10
                }
              />
            ) : (
              <Button
                label={t.projectwizardmodal2314}
                icon="pi pi-check"
                onClick={handleFinish}
                loading={loading}
                severity="success"
              />
            )}
          </div>
        </div>
      </div>

    </Dialog>

      {/* Project Unlock Modal - Shows BEFORE wizard for Free users with >= 1 project */}
      <ProjectUnlockModal
        visible={showProjectUnlockModal}
        onHide={() => {
          setShowProjectUnlockModal(false);
          onClose(); // Also close the wizard parent
        }}
        onConfirm={handleProjectUnlockConfirm}
        onBuyCredits={handleBuyCredits}
        onUpgradePatron={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
        currentCredits={currentUser?.credits || 0}
        creditCost={50}
      />

      {/* Plan Modal - For buying credits or upgrading subscription */}
      <PlanModal
        visible={showPlanModal}
        onHide={() => {
          setShowPlanModal(false);
          // Refresh credits after closing PlanModal (user might have bought credits)
          refreshCredits();
        }}
        initialTab={planModalInitialTab}
      />
    </>
  );
}
