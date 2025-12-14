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
  const { t: _t } = useTranslation(currentLanguage);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Project Creation
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowJoinRequests, setAllowJoinRequests] = useState(false);
  const [projectNameExists, setProjectNameExists] = useState(false);
  const [checkingProjectName, setCheckingProjectName] = useState(false);

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
      console.error('Error loading languages:', err);
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
        console.log('📋 Loaded schemas:', schemas.map((s: FloatingSchema) => ({ id: s.id, name: s.name, owner_id: s.owner_id })));
        setExistingSchemas(schemas);
      }
    } catch (err) {
      console.error('Error loading schemas:', err);
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
        console.log('💰 Credits refreshed:', userData.credits);
        setCurrentUser((prev: any) => ({ ...prev, credits: userData.credits }));
      }
    } catch (err) {
      console.error('Error refreshing credits:', err);
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
      console.error('Error loading templates:', err);
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
      console.error('Error loading teams:', err);
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

        console.log('👤 User data check:', {
          user_type: userData.user_type,
          isFreeUser,
          credits: userData.credits
        });

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
            console.error('Error loading schemas:', err);
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

            console.log('🔍 Project subscription check:', {
              isFreeUser,
              subscriptionInfo,
              totalProjects: data.total_projects,
              needsUnlock: subscriptionInfo?.needs_unlock
            });

            // Store subscription info for UI display
            if (subscriptionInfo) {
              setProjectSubscriptionInfo(subscriptionInfo);
            }

            // Use subscription_info.needs_unlock to determine if user needs to pay
            // needs_unlock = true when: owned_projects >= max_allowed (1 free + active subscriptions)
            if (subscriptionInfo && subscriptionInfo.needs_unlock) {
              // Start wizard at Step 0 (Project Unlock Screen)
              console.log('✋ Project unlock required - Step 0 will show unlock screen');
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
        console.error('Error checking access:', error);
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
      console.log('🔄 Step 5 reached, reloading schemas...');
      loadExistingSchemas();
    }
  }, [currentStep, showActualWizard, loadExistingSchemas]);

  // Refresh credits when entering Step 0 (Project Unlock)
  useEffect(() => {
    if (currentStep === 0 && showActualWizard) {
      console.log('🔄 Step 0 reached, refreshing credits...');
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
        console.error('Error checking project name:', err);
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
        console.error('Error checking schema name:', err);
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
        console.error('Error checking team name:', err);
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
        setError('Project name is required');
        return;
      }
      // Check snake_case format
      if (!/^[a-z0-9]+(_[a-z0-9]+)*$/.test(projectName)) {
        setError('Project name must be in snake_case format (lowercase letters, numbers, underscores)');
        return;
      }
      // Check if name already exists
      if (projectNameExists) {
        setError('Project name already exists. Please choose a different name.');
        return;
      }
    }

    // Step 5: Database Selection - Check if unlock is needed
    if (currentStep === 5) {
      if (databaseOption === 'existing' && !selectedSchemaId) {
        setError('Please select an existing database');
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

              console.log('🔍 Database unlock check:', {
                isFreeUser,
                subscriptionInfo
              });

              if (subscriptionInfo && subscriptionInfo.needs_unlock) {
                // User needs to unlock database - Step 6 will show unlock screen
                console.log('✋ Database unlock required - Step 6 will show unlock screen');
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
            console.error('Error checking schema count:', err);
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
        setError('Schema name is required');
        return;
      }
      if (schemaNameExists) {
        setError('A database with this name already exists. Please choose a different name.');
        return;
      }
      if (checkingSchemaName) {
        setError('Please wait while we check the database name...');
        return;
      }
    }

    // Step 8: SQL Import - optional, but validate if provided
    if (currentStep === 8 && databaseOption === 'new' && !skipSqlImport && sqlScript.trim()) {
      const sqlUpper = sqlScript.toUpperCase();
      if (!sqlUpper.includes('CREATE TABLE')) {
        setError('SQL script must contain at least one CREATE TABLE statement');
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
          setError('Please select an existing team');
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
        setError('Team name is required');
        return;
      }
      if (teamNameExists) {
        setError('A team with this name already exists. Please choose a different name.');
        return;
      }
      if (checkingTeamName) {
        setError('Please wait while we check the team name...');
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
        throw new Error('Not authenticated');
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
            if (reservedCreditsForProject > 0) parts.push(`${reservedCreditsForProject} für Projekt`);
            if (reservedCreditsForDatabase > 0) parts.push(`${reservedCreditsForDatabase} für Datenbank`);
            if (reservedCreditsForTeam > 0) parts.push(`${reservedCreditsForTeam} für Team`);
            setError(`Nicht genug Credits! Sie benötigen ${totalCreditsNeeded} Credits (${parts.join(' + ')}), haben aber nur ${userData.credits}.`);
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
          console.log('🔄 Found existing project with same name, reusing:', existingProject.id);
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
            setError(`Nicht genug Credits! Sie benötigen ${errorData.required_credits} Credits, haben aber nur ${errorData.current_credits}.`);
            setLoading(false);
            setPlanModalInitialTab(1);
            setShowPlanModal(true);
            return;
          }

          throw new Error(errorData.message || 'Failed to create project');
        }

        const project = await projectResponse.json();
        projectId = project.id;
        console.log('✓ Project created successfully:', projectId);
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
                console.log('🔄 Found existing schema linked to project, reusing:', existingSchema.id);
                schemaId = existingSchema.id;
              }
            }
          } catch {
            console.log('Could not check existing schemas, will create new one');
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
              setError(`Nicht genug Credits für Datenbank! Sie benötigen ${errorData.required_credits || 50} Credits.`);
              setLoading(false);
              setPlanModalInitialTab(1);
              setShowPlanModal(true);
              return;
            }

            const errorMessage = errorData.message || errorData.error || 'Unknown error';
            console.error('Schema creation failed:', errorData);
            throw new Error(`Failed to create schema: ${errorMessage}`);
          }

          const schema = await schemaResponse.json();
          schemaId = schema.id;
          console.log('✓ Schema created successfully:', schema);
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
          console.error('Schema association failed:', errorData);
          throw new Error(`Failed to link schema to project: ${errorData.message || errorData.error || 'Unknown error'}`);
        } else {
          console.log('✓ Schema associated with project successfully');
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
            setError(`Nicht genug Credits für Team! Sie benötigen ${errorData.required_credits || 50} Credits.`);
            setLoading(false);
            setPlanModalInitialTab(1);
            setShowPlanModal(true);
            return;
          }

          // Non-critical error - warn but continue
          console.error('Team creation failed:', errorData);
          alert(`⚠️ Warning: Team creation failed\n\n${errorData.message || 'Unknown error'}\n\nYour project has been created successfully. You can create teams later from the Teams panel.`);
        } else {
          console.log('✓ Team created and linked to project successfully');
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
          console.log('✓ Existing team linked to project successfully');
        } catch (err) {
          console.error('Team linking failed:', err);
          // Non-critical error
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
            const errorData = await linkResponse.json().catch(() => ({}));
            console.error(`Failed to link template ${templateId}:`, errorData);
          } else {
            console.log(`✓ Template ${templateId} linked to project successfully`);
          }
        } catch (err) {
          console.error(`Error linking template ${templateId}:`, err);
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
              description: importDescription || 'Initial import from wizard',
            }),
          });

          if (!importResponse.ok) {
            const errorData = await importResponse.json();
            console.error('SQL Import failed:', errorData);

            // Show warning but don't fail the entire wizard
            alert(`⚠️ Warning: SQL import failed\n\n${errorData.error || 'Unknown error'}\n\nYour project and schema have been created successfully and linked together. You can import your SQL later using the Database Designer.`);
          } else {
            console.log('✓ SQL imported successfully');
          }
        } catch (importError) {
          console.error('SQL Import error:', importError);
          // Continue anyway - project is already set up
          alert('⚠️ Warning: SQL import failed due to an error.\n\nYour project and schema have been created successfully and linked together. You can import your SQL later using the Database Designer.');
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
      console.log('🔄 Project changed event dispatched');

      if (onSuccess && projectId) {
        onSuccess(projectId);
      }
      handleClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete wizard');
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
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              🔓 Unlock Additional Project Slot
            </h3>

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-300 text-sm mb-2">
                <strong>Project Limit Reached</strong>
              </p>
              <p className="text-gray-300 text-sm">
                Your current limit: <strong>{maxAllowed} project{maxAllowed > 1 ? 's' : ''}</strong> (1 free{activeSubscriptions > 0 ? ` + ${activeSubscriptions} subscription${activeSubscriptions > 1 ? 's' : ''}` : ''})
              </p>
              <p className="text-gray-300 text-sm">
                Active projects: <strong>{currentProjects}</strong>
              </p>
              <p className="text-gray-300 text-sm mt-2">
                To create another project, you need to unlock a new slot for <strong>50 credits per year</strong>.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Your Credits:</span>
                <span className="text-white font-bold text-lg">{currentUser?.credits || 0}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Required Credits:</span>
                <span className="text-yellow-400 font-bold text-lg">50</span>
              </div>
              <hr className="border-gray-700 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-gray-300">After Unlock:</span>
                <span className={`font-bold text-lg ${hasEnoughCreditsForProject ? 'text-green-400' : 'text-red-400'}`}>
                  {hasEnoughCreditsForProject ? (currentUser?.credits || 0) - 50 : `Need ${creditsNeededForProject} more`}
                </span>
              </div>
            </div>

            {!hasEnoughCreditsForProject && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-red-300 text-sm">
                  ⚠️ You don't have enough credits. You need <strong>{creditsNeededForProject} more credits</strong> to unlock this project slot.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {hasEnoughCreditsForProject ? (
                <Button
                  label="Unlock Project Slot (50 Credits)"
                  icon="pi pi-unlock"
                  onClick={handleStep0UnlockConfirm}
                  className="flex-1"
                  severity="success"
                />
              ) : (
                <Button
                  label="Buy Credits"
                  icon="pi pi-shopping-cart"
                  onClick={handleBuyCredits}
                  className="flex-1"
                  severity="warning"
                />
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Or upgrade to{' '}
              <button
                type="button"
                onClick={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
                className="text-yellow-400 hover:text-yellow-300 underline font-semibold"
              >
                Patron Monthly
              </button>
              {' '}for unlimited projects!
            </p>
          </div>
        );
      }

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Project Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Name *
              </label>
              <InputText
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my_awesome_project"
                className={`w-full ${projectNameExists ? 'border-red-500' : ''}`}
              />
              <div className="flex items-center gap-2 mt-1">
                {checkingProjectName && projectName.trim() && (
                  <small className="text-blue-400 flex items-center gap-1">
                    <i className="pi pi-spin pi-spinner"></i>
                    Checking availability...
                  </small>
                )}
                {!checkingProjectName && projectName.trim() && projectNameExists && (
                  <small className="text-red-400 flex items-center gap-1">
                    <i className="pi pi-times-circle"></i>
                    Project name already exists
                  </small>
                )}
                {!checkingProjectName && projectName.trim() && !projectNameExists && /^[a-z0-9]+(_[a-z0-9]+)*$/.test(projectName) && (
                  <small className="text-green-400 flex items-center gap-1">
                    <i className="pi pi-check-circle"></i>
                    Available
                  </small>
                )}
              </div>
              <small className="text-gray-400 block mt-1">Use snake_case format (lowercase, underscores)</small>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <InputTextarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
                placeholder="Project description..."
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
                <label htmlFor="is_public" className="ml-2 text-gray-300">Public Project</label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  inputId="allow_join"
                  checked={allowJoinRequests}
                  onChange={(e) => setAllowJoinRequests(e.checked || false)}
                />
                <label htmlFor="allow_join" className="ml-2 text-gray-300">Allow Join Requests</label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Project Properties</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Directory
              </label>
              <InputText
                value={projectDirectory}
                onChange={(e) => setProjectDirectory(e.target.value)}
                placeholder="C:\Users\Public\Documents\my_project"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project URL
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Page
                </label>
                <InputText
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  placeholder="index.php"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filename Short Length
                </label>
                <Dropdown
                  value={filenameShortLength}
                  onChange={(e) => setFilenameShortLength(e.value)}
                  options={[
                    { label: '2 characters', value: 2 },
                    { label: '3 characters', value: 3 },
                    { label: '4 characters', value: 4 },
                    { label: '5 characters', value: 5 },
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
            <h3 className="text-lg font-semibold text-gray-100">Database Connection</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Database Type
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Server
                </label>
                <InputText
                  value={databaseServer}
                  onChange={(e) => setDatabaseServer(e.target.value)}
                  placeholder="127.0.0.1"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Port
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <InputText
                value={databaseUsername}
                onChange={(e) => setDatabaseUsername(e.target.value)}
                placeholder="database_user"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
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
            <h3 className="text-lg font-semibold text-gray-100">Language Selection</h3>
            <p className="text-sm text-gray-400">
              Select the languages you want to use for code generation in this project.
            </p>
            <p className="text-xs text-gray-400">
              Use the arrow buttons to move languages between lists, and the up/down buttons to reorder selected languages.
            </p>
            <PickList
              source={sourceLanguages}
              target={targetLanguages}
              onChange={(e) => {
                // Maintain the order of target languages
                const targetCodes = e.target.map((item: Language) => item.code);
                setSelectedLanguages(targetCodes);
              }}
              itemTemplate={(item: Language) => `${item.native_name} (${item.name})`}
              sourceHeader="Available Languages"
              targetHeader="Selected Languages (ordered)"
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
            <h3 className="text-lg font-semibold text-gray-100">Database/Schema Selection</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="new_db"
                  checked={databaseOption === 'new'}
                  onChange={() => setDatabaseOption('new')}
                  className="mr-2"
                />
                <label htmlFor="new_db" className="text-gray-300">Create new database</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="existing_db"
                  checked={databaseOption === 'existing'}
                  onChange={() => setDatabaseOption('existing')}
                  className="mr-2"
                />
                <label htmlFor="existing_db" className="text-gray-300">Use existing database</label>
              </div>
            </div>

            {databaseOption === 'existing' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Database
                </label>
                <Dropdown
                  value={selectedSchemaId}
                  onChange={(e) => setSelectedSchemaId(e.value)}
                  options={existingSchemas.map(s => ({ label: s.name, value: s.id }))}
                  placeholder="Select a database..."
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
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              🔓 Unlock Additional Database
            </h3>

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-300 text-sm mb-2">
                <strong>Free Tier Limit Reached</strong>
              </p>
              <p className="text-gray-300 text-sm">
                Free users can have <strong>1 database</strong>. You currently have <strong>1 database</strong>.
              </p>
              <p className="text-gray-300 text-sm mt-2">
                To create additional databases, you need to unlock them for <strong>50 credits per database per year</strong>.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Your Credits:</span>
                <span className="text-white font-bold text-lg">{currentUser?.credits || 0}</span>
              </div>
              {reservedCreditsForProject > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Reserved for Project:</span>
                  <span className="text-orange-400 font-bold text-lg">-{reservedCreditsForProject}</span>
                </div>
              )}
              {reservedCreditsForProject > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Available Credits:</span>
                  <span className="text-white font-bold text-lg">{availableCreditsForDb}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Required for Database:</span>
                <span className="text-yellow-400 font-bold text-lg">50</span>
              </div>
              <hr className="border-gray-700 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-gray-300">After Unlock:</span>
                <span className={`font-bold text-lg ${hasEnoughCreditsForDb ? 'text-green-400' : 'text-red-400'}`}>
                  {hasEnoughCreditsForDb ? availableCreditsForDb - 50 : `Need ${creditsNeededForDb} more`}
                </span>
              </div>
            </div>

            {!hasEnoughCreditsForDb && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-red-300 text-sm">
                  ⚠️ You don't have enough credits. You need <strong>{creditsNeededForDb} more credits</strong> to unlock this database.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {hasEnoughCreditsForDb ? (
                <Button
                  label="Unlock Database (50 Credits)"
                  icon="pi pi-unlock"
                  onClick={handleStep6UnlockConfirm}
                  className="flex-1"
                  severity="success"
                />
              ) : (
                <Button
                  label="Buy Credits"
                  icon="pi pi-shopping-cart"
                  onClick={handleBuyCredits}
                  className="flex-1"
                  severity="warning"
                />
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Or upgrade to{' '}
              <button
                type="button"
                onClick={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
                className="text-yellow-400 hover:text-yellow-300 underline font-semibold"
              >
                Patron Monthly
              </button>
              {' '}for unlimited databases!
            </p>
          </div>
        );
      }

      case 7:
        // Step 7: Database Details (only shown when creating new database)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">New Database Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Database Name *
              </label>
              <InputText
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="my_database"
                className={`w-full ${schemaNameExists ? 'border-red-500' : ''}`}
              />
              <div className="flex items-center gap-2 mt-1">
                {checkingSchemaName && schemaName.trim() && (
                  <small className="text-blue-400 flex items-center gap-1">
                    <i className="pi pi-spin pi-spinner"></i>
                    Checking availability...
                  </small>
                )}
                {!checkingSchemaName && schemaName.trim() && schemaNameExists && (
                  <small className="text-red-400 flex items-center gap-1">
                    <i className="pi pi-times-circle"></i>
                    Database name already exists
                  </small>
                )}
                {!checkingSchemaName && schemaName.trim() && !schemaNameExists && (
                  <small className="text-green-400 flex items-center gap-1">
                    <i className="pi pi-check-circle"></i>
                    Available
                  </small>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <InputTextarea
                value={schemaDescription}
                onChange={(e) => setSchemaDescription(e.target.value)}
                rows={3}
                placeholder="Database description..."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visibility
              </label>
              <Dropdown
                value={schemaVisibility}
                onChange={(e) => setSchemaVisibility(e.value)}
                options={[
                  { label: 'Public', value: 'public' },
                  { label: 'Private', value: 'private' },
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
            <h3 className="text-lg font-semibold text-gray-100">Import SQL (Optional)</h3>
            <p className="text-sm text-gray-400">
              You can import your SQL script now or skip and import later from the Database Designer.
            </p>

            {/* Skip SQL Import Checkbox */}
            <div className="flex items-center p-3 bg-gray-700 rounded">
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
              <label htmlFor="skip_sql_import" className="ml-2 text-gray-300">
                Skip SQL import (I'll import later)
              </label>
            </div>

            {!skipSqlImport && (
              <>
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload SQL File
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
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
                    >
                      <i className="pi pi-upload"></i>
                      <span>Choose SQL File</span>
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
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {sqlScript && (
                    <p className="text-sm text-green-400 mt-2">
                      ✓ SQL loaded ({sqlScript.length} characters)
                    </p>
                  )}
                </div>

                {/* Paste SQL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Or Paste SQL Script
                  </label>
                  <textarea
                    value={sqlScript}
                    onChange={(e) => setSqlScript(e.target.value)}
                    rows={10}
                    placeholder="CREATE TABLE users (...);"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                  />
                  <small className="text-gray-400">
                    The SQL script should contain at least one CREATE TABLE statement
                  </small>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Import Description (optional)
                  </label>
                  <InputText
                    value={importDescription}
                    onChange={(e) => setImportDescription(e.target.value)}
                    placeholder="Initial database structure"
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
            <h3 className="text-lg font-semibold text-gray-100">Team Assignment (Optional)</h3>
            <p className="text-sm text-gray-400">
              Teams allow multiple users to collaborate on this project. You can skip this step and create teams later.
            </p>

            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-700 rounded hover:bg-gray-650 cursor-pointer" onClick={() => setTeamOption('skip')}>
                <input
                  type="radio"
                  id="team_skip"
                  checked={teamOption === 'skip'}
                  onChange={() => setTeamOption('skip')}
                  className="mr-3"
                />
                <label htmlFor="team_skip" className="text-gray-300 cursor-pointer flex-1">
                  <span className="font-medium">Skip team creation</span>
                  <p className="text-xs text-gray-400 mt-1">I'll manage teams later from the Teams panel</p>
                </label>
              </div>

              <div className="flex items-center p-3 bg-gray-700 rounded hover:bg-gray-650 cursor-pointer" onClick={() => setTeamOption('new')}>
                <input
                  type="radio"
                  id="team_new"
                  checked={teamOption === 'new'}
                  onChange={() => setTeamOption('new')}
                  className="mr-3"
                />
                <label htmlFor="team_new" className="text-gray-300 cursor-pointer flex-1">
                  <span className="font-medium">Create a new team</span>
                  <p className="text-xs text-gray-400 mt-1">Create a new team and assign it to this project</p>
                </label>
              </div>

              {existingTeams.length > 0 && (
                <div className="flex items-center p-3 bg-gray-700 rounded hover:bg-gray-650 cursor-pointer" onClick={() => setTeamOption('existing')}>
                  <input
                    type="radio"
                    id="team_existing"
                    checked={teamOption === 'existing'}
                    onChange={() => setTeamOption('existing')}
                    className="mr-3"
                  />
                  <label htmlFor="team_existing" className="text-gray-300 cursor-pointer flex-1">
                    <span className="font-medium">Use an existing team</span>
                    <p className="text-xs text-gray-400 mt-1">Assign an existing team to this project</p>
                  </label>
                </div>
              )}
            </div>

            {teamOption === 'existing' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Team
                </label>
                <Dropdown
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.value)}
                  options={existingTeams.map(t => ({ label: t.name, value: t.id }))}
                  placeholder="Select a team..."
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
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              🔓 Unlock Team Feature
            </h3>

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-300 text-sm mb-2">
                <strong>Team Feature - Free Tier</strong>
              </p>
              <p className="text-gray-300 text-sm">
                Teams is an additional feature for free users. Each team costs <strong>50 credits per year</strong>.
              </p>
              {ownedTeams > 0 && (
                <p className="text-gray-300 text-sm mt-2">
                  You currently have <strong>{ownedTeams} team{ownedTeams > 1 ? 's' : ''}</strong>
                  {activeTeamSubscriptions > 0 && ` (${activeTeamSubscriptions} subscription${activeTeamSubscriptions > 1 ? 's' : ''})`}.
                </p>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Your Credits:</span>
                <span className="text-white font-bold text-lg">{currentUser?.credits || 0}</span>
              </div>
              {(reservedCreditsForProject > 0 || reservedCreditsForDatabase > 0) && (
                <>
                  {reservedCreditsForProject > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Reserved for Project:</span>
                      <span className="text-orange-400 font-bold text-lg">-{reservedCreditsForProject}</span>
                    </div>
                  )}
                  {reservedCreditsForDatabase > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Reserved for Database:</span>
                      <span className="text-orange-400 font-bold text-lg">-{reservedCreditsForDatabase}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Available Credits:</span>
                    <span className="text-white font-bold text-lg">{availableCreditsForTeam}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Required for Team:</span>
                <span className="text-yellow-400 font-bold text-lg">50</span>
              </div>
              <hr className="border-gray-700 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-gray-300">After Unlock:</span>
                <span className={`font-bold text-lg ${hasEnoughCreditsForTeam ? 'text-green-400' : 'text-red-400'}`}>
                  {hasEnoughCreditsForTeam ? availableCreditsForTeam - 50 : `Need ${creditsNeededForTeam} more`}
                </span>
              </div>
            </div>

            {!hasEnoughCreditsForTeam && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-red-300 text-sm">
                  ⚠️ You don't have enough credits. You need <strong>{creditsNeededForTeam} more credits</strong> to unlock the team feature.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {hasEnoughCreditsForTeam ? (
                <Button
                  label="Unlock Team (50 Credits)"
                  icon="pi pi-unlock"
                  onClick={handleStep10TeamUnlockConfirm}
                  className="flex-1"
                  severity="success"
                />
              ) : (
                <Button
                  label="Buy Credits"
                  icon="pi pi-shopping-cart"
                  onClick={handleBuyCredits}
                  className="flex-1"
                  severity="warning"
                />
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Or upgrade to{' '}
              <button
                type="button"
                onClick={() => { setPlanModalInitialTab(0); setShowPlanModal(true); }}
                className="text-yellow-400 hover:text-yellow-300 underline font-semibold"
              >
                Patron Monthly
              </button>
              {' '}for unlimited teams!
            </p>
          </div>
        );
      }

      case 11:
        // Step 11: Team Details (only shown when creating new team)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">New Team Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team Name *
              </label>
              <InputText
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="my_team"
                className={`w-full ${teamNameExists ? 'border-red-500' : ''}`}
              />
              <div className="flex items-center gap-2 mt-1">
                {checkingTeamName && teamName.trim() && (
                  <small className="text-blue-400 flex items-center gap-1">
                    <i className="pi pi-spin pi-spinner"></i>
                    Checking availability...
                  </small>
                )}
                {!checkingTeamName && teamName.trim() && teamNameExists && (
                  <small className="text-red-400 flex items-center gap-1">
                    <i className="pi pi-times-circle"></i>
                    Team name already exists
                  </small>
                )}
                {!checkingTeamName && teamName.trim() && !teamNameExists && (
                  <small className="text-green-400 flex items-center gap-1">
                    <i className="pi pi-check-circle"></i>
                    Available
                  </small>
                )}
              </div>
              <small className="text-gray-400 block mt-1">Use lowercase letters, numbers, and underscores</small>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team Description
              </label>
              <InputTextarea
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                rows={3}
                placeholder="Team description..."
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
            <h3 className="text-lg font-semibold text-gray-100">Template Selection (Optional)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter Templates
              </label>
              <Dropdown
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.value)}
                options={[
                  { label: 'All Templates', value: 'all' },
                  { label: 'Private (My Templates)', value: 'private' },
                  { label: 'Public (User Templates)', value: 'public' },
                  { label: 'System (Scoriet Templates)', value: 'system' },
                ]}
                className="w-full"
              />
            </div>

            <div className="border border-gray-600 rounded p-4 max-h-96 overflow-y-auto">
              {filteredTemplates.length === 0 ? (
                <p className="text-gray-400 text-center">No templates available</p>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map(template => (
                    <div key={template.id} className="flex items-start gap-3 p-2 hover:bg-gray-700 rounded">
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
                        <label htmlFor={`template_${template.id}`} className="text-gray-200 cursor-pointer">
                          {template.name}
                        </label>
                        {template.description && (
                          <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Selected templates will be linked to your project. You can add more templates later.
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
      header={currentStep === 0 ? 'Project Setup Wizard - Unlock Project' : `Project Setup Wizard - Step ${currentStep} of ${totalSteps}`}
      visible={showActualWizard}
      onHide={handleClose}
      style={{ width: '60vw', maxWidth: '900px' }}
      modal
      closable={!loading}
      draggable={false}
      className="project-wizard-modal"
      contentStyle={{
        padding: '1.5rem',
        backgroundColor: '#1f2937',
        color: 'white',
        minHeight: '500px',
      }}
      headerStyle={{
        backgroundColor: '#1f2937',
        color: 'white',
        borderBottom: '1px solid #374151',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Progress Bar */}
        <div className="mb-6">
          {currentStep === 0 ? (
            /* Step 0: Show unlock indicator instead of normal progress */
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold bg-yellow-600 text-white">
                🔓
              </div>
              <span className="text-yellow-400 font-medium">Unlock Project to Continue</span>
            </div>
          ) : (
            /* Steps 1-10: Normal progress bar */
            <>
              <div className="flex justify-between mb-2">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-400'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-200">
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
        <div className="flex justify-between items-center pt-4 border-t border-gray-600">
          <Button
            label="Back"
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
            <label htmlFor="show_wizard_on_start" className="ml-2 text-sm text-gray-300">
              Open this wizard on app start
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              label="Cancel"
              onClick={handleClose}
              disabled={loading}
              severity="secondary"
              outlined
            />
            {currentStep < totalSteps ? (
              <Button
                label="Next"
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
                label="Create Project"
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
