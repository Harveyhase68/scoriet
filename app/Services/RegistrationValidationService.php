<?php

namespace App\Services;

use Illuminate\Http\Request;

class RegistrationValidationService
{
    /**
     * List of known disposable email domains
     */
    private array $disposableEmailDomains = [
        // temp-mail.org domains (they rotate these frequently)
        'gamintor.com', 'casenative.com', 'cyclelove.cc', 'forecastertests.com',
        'inboxmail.world', 'kaftee.com', 'magicmail.cc', 'mailboxt.com',
        'mailproxsy.com', 'midiharmonica.com', 'munoubengoshi.com', 'rungel.net',
        'stfrancisofassisischool.com', 'tidissajiede.com', 'vvatxva.com',
        'zetmail.com', 'zlorkun.com', 'zslsz.com', 'tmpmail.org', 'tmpmail.net',
        'tmmbt.com', 'tmmbt.net', 'tmmwj.com', 'tmmwj.net', 'tmails.net',

        // Popular disposable email services
        '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org',
        'guerrillamail.com', 'guerrillamail.org', 'guerrillamail.net', 'guerrillamail.biz',
        'mailinator.com', 'mailinater.com', 'mailinator2.com', 'mailinator.net',
        'throwaway.email', 'throwawaymail.com', 'disposablemail.com',
        'fakeinbox.com', 'trashmail.com', 'trashmail.net', 'trashmail.org',
        'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf',
        'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
        'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
        'getnada.com', 'nada.email', 'tempail.com', 'tempr.email',
        'discard.email', 'discardmail.com', 'discardmail.de',
        'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
        'mytrashmail.com', 'mt2015.com', 'thankyou2010.com',
        'trash2009.com', 'mt2009.com', 'trashymail.com',
        'antispam.de', 'objectmail.com', 'proxymail.eu',
        'rcpt.at', 'trash-mail.at', 'trashmail.at', 'trashmail.me',
        'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
        'emailondeck.com', 'anonymbox.com', 'sharklasers.com',
        'guerrillamailblock.com', 'pokemail.net', 'spam4.me',
        'grr.la', 'getairmail.com', 'dispostable.com',
        'mailnesia.com', 'mailnull.com', 'mailscrap.com',
        'mintemail.com', 'mohmal.com', 'tempmailo.com',
        'tempomail.fr', 'tempr.email', 'tmpmail.net', 'tmpmail.org',
        'emailfake.com', 'fakemailgenerator.com', 'emailtemporar.ro',
        'mohmal.im', 'mohmal.in', 'mohmal.tech', 'dropmail.me',
        'crazymailing.com', 'tempsky.com', 'burnermail.io',
        'mailsac.com', 'inboxkitten.com', 'tempinbox.com',
        'fakemailgenerator.net', 'emailondeck.com', '33mail.com',
        'maildrop.cc', 'mailnesia.com', 'spamex.com',
        'incognitomail.com', 'incognitomail.net', 'incognitomail.org',
        'privymail.de', 'sofort-mail.de', 'sofortmail.de',
        'spambog.com', 'spambog.de', 'spambog.ru',
        'bodhi.lawlita.com', 'bofthew.com', 'brefmail.com',
        'brennendesreich.de', 'broadbandninja.com', 'bsnow.net',
        'bugmenot.com', 'bumpymail.com', 'casualdx.com', 'centermail.com',
        'cheatmail.de', 'consumerriot.com', 'correo.blogos.net',
        'curryworld.de', 'cust.in', 'dacoolest.com', 'dandikmail.com',
        'deadaddress.com', 'despam.it', 'despammed.com', 'devnullmail.com',
        'dfgh.net', 'digitalsanctuary.com', 'dingbone.com', 'dodgeit.com',
        'dodgit.com', 'donemail.ru', 'dontreg.com', 'dontsendmespam.de',
        'dump-email.info', 'dumpyemail.com', 'e4ward.com', 'easytrashmail.com',
        'einrot.com', 'emailias.com', 'emailigo.de', 'emailinfive.com',
        'emailmiser.com', 'emailsensei.com', 'emailtemporario.com.br',
        'emailto.de', 'emailwarden.com', 'emailx.at.hm', 'emailxfer.com',
        'emz.net', 'enterto.com', 'ephemail.net', 'etranquil.com',
        'etranquil.net', 'etranquil.org', 'evopo.com', 'explodemail.com',
        'express.net.ua', 'eyepaste.com', 'fakedemail.com', 'fakeinformation.com',
        'fastacura.com', 'fastchevy.com', 'fastchrysler.com', 'fastkawasaki.com',
        'fastmazda.com', 'fastmitsubishi.com', 'fastnissan.com', 'fastsubaru.com',
        'fastsuzuki.com', 'fasttoyota.com', 'fastyamaha.com', 'filzmail.com',
        'fizmail.com', 'flyspam.com', 'fr33mail.info', 'frapmail.com',
        'friendlymail.co.uk', 'fuckingduh.com', 'fudgerub.com', 'garliclife.com',
        'gehensiull.com', 'gelitik.in', 'ghosttexter.de', 'girlsundertheinfluence.com',
        'gishpuppy.com', 'gowikibooks.com', 'gowikicampus.com', 'gowikicars.com',
        'gowikifilms.com', 'gowikigames.com', 'gowikimusic.com', 'gowikinetwork.com',
        'gowikitravel.com', 'gowikitv.com', 'grandmamail.com', 'grandmasmail.com',
        'great-host.in', 'greensloth.com', 'h8s.org', 'haltospam.com',
        'hatespam.org', 'hidemail.de', 'hochsitze.com', 'hotpop.com',
        'hulapla.de', 'ieatspam.eu', 'ieatspam.info', 'ihateyoualot.info',
        'imails.info', 'inbax.tk', 'inbox.si', 'inboxalias.com', 'inboxclean.com',
        'inboxclean.org', 'infocom.zp.ua', 'instant-mail.de', 'ipoo.org',
        'irish2me.com', 'iwi.net', 'jetable.com', 'jetable.net', 'jetable.org',
        'jnxjn.com', 'jourrapide.com', 'jsrsolutions.com', 'kasmail.com',
        'kaspop.com', 'keepmymail.com', 'killmail.com', 'killmail.net',
        'kimsdisk.com', 'klassmaster.com', 'klassmaster.net', 'klzlv.com',
        'kulturbetrieb.info', 'kurzepost.de', 'lawlita.com', 'letthemeatspam.com',
        'lhsdv.com', 'lifebyfood.com', 'link2mail.net', 'litedrop.com',
        'lol.ovpn.to', 'lookugly.com', 'lopl.co.cc', 'lortemail.dk',
        'lovemeleaveme.com', 'lr78.com', 'maboard.com', 'mail-hierarchie.net',
        'mail.by', 'mail.mezimages.net', 'mail.zp.ua', 'mail2rss.org',
        'mail333.com', 'mail4trash.com', 'mailbidon.com', 'mailblocks.com',
        'mailcatch.com', 'mailexpire.com', 'mailfreeonline.com', 'mailfs.com',
        'mailin8r.com', 'mailinater.com', 'mailme24.com', 'mailmoat.com',
        'mailquack.com', 'mailslapping.com', 'mailzilla.com', 'mailzilla.org',
        'mbx.cc', 'mega.zik.dj', 'meinspamschutz.de', 'messagebeamer.de',
        'mierdamail.com', 'migumail.com', 'moburl.com', 'moncourrier.fr.nf',
        'monemail.fr.nf', 'monmail.fr.nf', 'msa.minsmail.com', 'mt2014.com',
        'mx0.wwwnew.eu', 'mycleaninbox.net', 'mypartyclip.de', 'myphantomemail.com',
        'myspaceinc.com', 'myspaceinc.net', 'myspacepimpedup.com', 'mytrashmail.com',
        'neomailbox.com', 'nepwk.com', 'nervmich.net', 'nervtmansen.de',
        'netmails.com', 'netmails.net', 'netzidiot.de', 'neverbox.com',
        'nobulk.com', 'noclickemail.com', 'nogmailspam.info', 'nomail.xl.cx',
        'nomail2me.com', 'nomorespamemails.com', 'nospam.ze.tc', 'nospam4.us',
        'nospamfor.us', 'nospammail.net', 'nospamthanks.info', 'notmailinator.com',
        'nowmymail.com', 'nurfuerspam.de', 'nus.edu.sg', 'nwldx.com',
        'o2stk.org', 'objectmail.com', 'obobbo.com', 'odnorazovoe.ru',
        'oneoffemail.com', 'onewaymail.com', 'online.ms', 'oopi.org',
        'opayq.com', 'ordinaryamerican.net', 'otherinbox.com', 'ourklips.com',
        'outlawspam.com', 'ovpn.to', 'owned-by.us', 'owlpic.com',
        'pancakemail.com', 'pimpedupmyspace.com', 'pisem.net', 'pjjkp.com',
        'plexolan.de', 'poczta.onet.pl', 'politikerclub.de', 'poofy.org',
        'pookmail.com', 'privacy.net', 'privy-mail.com', 'privymail.de',
        'proxymail.eu', 'prtnx.com', 'punkass.com', 'putthisinyourspamdatabase.com',
        'pwrby.com', 'qisdo.com', 'qisoa.com', 'quickinbox.com',
        'quickmail.nl', 'rainmail.biz', 'rcpt.at', 'reallymymail.com',
        'realtyalerts.ca', 'recode.me', 'recursor.net', 'recyclemail.dk',
        'regbypass.com', 'regbypass.comsafe-mail.net', 'rejectmail.com',
        'remail.cf', 'remail.ga', 'rhyta.com', 'rklips.com', 'rmqkr.net',
        's0ny.net', 'safe-mail.net', 'safersignup.de', 'safetymail.info',
        'safetypost.de', 'sandelf.de', 'saynotospams.com', 'schafmail.de',
        'schrott-email.de', 'secretemail.de', 'secure-mail.biz', 'selfdestructingmail.com',
        'sendspamhere.com', 'senseless-entertainment.com', 'server.ms.selfip.net',
        'sharedmailbox.org', 'shieldemail.com', 'shiftmail.com', 'shitmail.me',
        'shortmail.net', 'shut.name', 'shut.ws', 'sibmail.com',
        'sinnlos-mail.de', 'slapsfromlastnight.com', 'slaskpost.se', 'slave-auctions.net',
        'slopsbox.com', 'slowslow.de', 'smellfear.com', 'smellrear.com',
        'snakemail.com', 'sneakemail.com', 'snkmail.com', 'sofimail.com',
        'sofort-mail.de', 'sogetthis.com', 'soodonims.com', 'spam.la',
        'spam.su', 'spam4.me', 'spamail.de', 'spamarrest.com',
        'spamavert.com', 'spambob.com', 'spambob.net', 'spambob.org',
        'spambog.com', 'spambog.de', 'spambog.ru', 'spambox.info',
        'spambox.us', 'spamcannon.com', 'spamcannon.net', 'spamcero.com',
        'spamcon.org', 'spamcorptastic.com', 'spamcowboy.com', 'spamcowboy.net',
        'spamcowboy.org', 'spamday.com', 'spameater.com', 'spameater.org',
        'spamex.com', 'spamfree.eu', 'spamfree24.com', 'spamfree24.de',
        'spamfree24.eu', 'spamfree24.info', 'spamfree24.net', 'spamfree24.org',
        'spamgoes.in', 'spamherelots.com', 'spamhereplease.com', 'spamhole.com',
        'spamify.com', 'spaminator.de', 'spamkill.info', 'spaml.com',
        'spaml.de', 'spammotel.com', 'spamobox.com', 'spamoff.de',
        'spamslicer.com', 'spamspot.com', 'spamstack.net', 'spamthis.co.uk',
        'spamthisplease.com', 'spamtrail.com', 'spamtroll.net', 'speed.1s.fr',
        'sperke.net', 'spikio.com', 'spoofmail.de', 'squizzy.de',
        'ssoia.com', 'startkeys.com', 'stinkefinger.net', 'stop-my-spam.cf',
        'stop-my-spam.com', 'stop-my-spam.ga', 'stop-my-spam.ml', 'stop-my-spam.tk',
        'streetwisemail.com', 'stuffmail.de', 'super-auswahl.de', 'supergreatmail.com',
        'supermailer.jp', 'superrito.com', 'superstachel.de', 'suremail.info',
        'sweetxxx.de', 'tagyourself.com', 'techemail.com', 'techgroup.me',
        'teleosaurs.xyz', 'teleworm.com', 'teleworm.us', 'temp.emeraldwebmail.com',
        'temp15qm.com', 'tempemailaddress.com', 'tempinbox.co.uk', 'tempinbox.com',
        'tempmail.eu', 'tempmail.it', 'tempmail2.com', 'tempmailer.com',
        'tempmailer.de', 'tempomail.fr', 'temporarily.de', 'temporaryemail.net',
        'temporaryemail.us', 'temporaryforwarding.com', 'temporaryinbox.com', 'temporarymailaddress.com',
        'tempthe.net', 'thankyou2010.com', 'thecloudindex.com', 'thisisnotmyrealemail.com',
        'throam.com', 'throwam.com', 'throwawayemailaddress.com', 'tilien.com',
        'tmailinator.com', 'toiea.com', 'tokenmail.de', 'toomail.biz',
        'topranklist.de', 'tradermail.info', 'trash-amil.com', 'trash-mail.at',
        'trash-mail.com', 'trash-mail.de', 'trash-mail.ga', 'trash-mail.gq',
        'trash-mail.ml', 'trash-mail.tk', 'trash2009.com', 'trashbox.eu',
        'trashdevil.com', 'trashdevil.de', 'trashmail.at', 'trashmail.com',
        'trashmail.de', 'trashmail.me', 'trashmail.net', 'trashmail.org',
        'trashmail.ws', 'trashmailer.com', 'trashymail.com', 'trashymail.net',
        'trbvm.com', 'trickmail.net', 'trillianpro.com', 'tryalert.com',
        'turual.com', 'twinmail.de', 'tyldd.com', 'uggsrock.com',
        'umail.net', 'upliftnow.com', 'uplipht.com', 'uroid.com',
        'valemail.net', 'venompen.com', 'veryrealemail.com', 'viditag.com',
        'viewcastmedia.com', 'viewcastmedia.net', 'viewcastmedia.org', 'viralplays.com',
        'vkcode.ru', 'vpn.st', 'vsimcard.com', 'vubby.com',
        'wasteland.rfc822.org', 'webemail.me', 'webm4il.info', 'webuser.in',
        'wee.my', 'weg-werf-email.de', 'wegwerf-email-addressen.de', 'wegwerf-emails.de',
        'wegwerfadresse.de', 'wegwerfemail.com', 'wegwerfemail.de', 'wegwerfmail.de',
        'wegwerfmail.info', 'wegwerfmail.net', 'wegwerfmail.org', 'wetrainbayarea.com',
        'wetrainbayarea.org', 'wh4f.org', 'whopy.com', 'whyspam.me',
        'willhackforfood.biz', 'willselfdestruct.com', 'winemaven.info', 'wolfsmail.tk',
        'writeme.us', 'wronghead.com', 'wuzup.net', 'wuzupmail.net',
        'wwwnew.eu', 'x.ip6.li', 'xagloo.co', 'xagloo.com',
        'xemaps.com', 'xents.com', 'xmaily.com', 'xoxy.net',
        'yapped.net', 'yeah.net', 'yep.it', 'yogamaven.com',
        'yopmail.com', 'yopmail.fr', 'yopmail.net', 'yourdomain.com',
        'ypmail.webarnak.fr.eu.org', 'yuurok.com', 'zehnminutenmail.de', 'zippymail.info',
        'zoaxe.com', 'zoemail.com', 'zoemail.net', 'zoemail.org',
        'zomg.info', 'zxcv.com', 'zxcvbnm.com', 'zzz.com',
    ];

    /**
     * Known Tor exit node IPs (sample - in production, use a regularly updated list)
     * You should update this list regularly from: https://check.torproject.org/exit-addresses
     */
    private array $torExitNodes = [];

    /**
     * Validate registration request
     *
     * @return array ['valid' => bool, 'errors' => array]
     */
    public function validate(Request $request): array
    {
        $errors = [];

        // Check for Tor/VPN
        $ipCheck = $this->checkIpAddress($request->ip());
        if (!$ipCheck['valid']) {
            $errors['ip'] = $ipCheck['message'];
        }

        // Check email
        $email = $request->input('email');
        if ($email) {
            // Check for "scoriet" in email name
            $scorietCheck = $this->checkScorietInEmail($email);
            if (!$scorietCheck['valid']) {
                $errors['email'] = $scorietCheck['message'];
            }

            // Check for disposable email
            $disposableCheck = $this->checkDisposableEmail($email);
            if (!$disposableCheck['valid']) {
                $errors['email'] = $disposableCheck['message'];
            }

            // Check MX records
            $mxCheck = $this->checkMxRecords($email);
            if (!$mxCheck['valid']) {
                $errors['email'] = $mxCheck['message'];
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Check if IP is from Tor or known VPN
     */
    public function checkIpAddress(string $ip): array
    {
        // Skip check for localhost/development
        if (in_array($ip, ['127.0.0.1', '::1', '10.0.0.8'])) {
            return ['valid' => true, 'message' => ''];
        }

        // Check against Tor exit nodes
        if ($this->isTorExitNode($ip)) {
            \Log::warning(__('registrationvalidationservicephp245'), ['ip' => $ip]);
            return [
                'valid' => false,
                'message' => __('registrationvalidationservicephp248'),
            ];
        }

        // For VPN detection, you could integrate with services like:
        // - IPQualityScore
        // - IP2Location
        // - MaxMind GeoIP
        // For now, we'll skip VPN detection as it requires external API

        return ['valid' => true, 'message' => ''];
    }

    /**
     * Check if IP is a known Tor exit node
     */
    private function isTorExitNode(string $ip): bool
    {
        // Load Tor exit nodes from cache or file
        $torNodes = $this->loadTorExitNodes();
        return in_array($ip, $torNodes);
    }

    /**
     * Load Tor exit nodes from cache/file
     */
    private function loadTorExitNodes(): array
    {
        // Check cache first
        $cacheKey = 'tor_exit_nodes';
        $cached = cache($cacheKey);

        if ($cached !== null) {
            return $cached;
        }

        // Try to load from file
        $filePath = storage_path('app/tor_exit_nodes.txt');
        if (file_exists($filePath)) {
            $nodes = array_filter(array_map('trim', file($filePath)));
            cache([$cacheKey => $nodes], now()->addHours(6));
            return $nodes;
        }

        return $this->torExitNodes;
    }

    /**
     * Check if email contains "scoriet" in the local part
     */
    public function checkScorietInEmail(string $email): array
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return ['valid' => false, 'message' => __('registrationvalidationservicephp302')];
        }

        $localPart = strtolower($parts[0]);

        // Check if local part contains "scoriet"
        if (str_contains($localPart, 'scoriet')) {
            \Log::warning(__('registrationvalidationservicephp309'), ['email' => $email]);
            return [
                'valid' => false,
                'message' => __('registrationvalidationservicephp312'),
            ];
        }

        return ['valid' => true, 'message' => ''];
    }

    /**
     * Check if email domain is a known disposable email service
     */
    public function checkDisposableEmail(string $email): array
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return ['valid' => false, 'message' => __('registrationvalidationservicephp326')];
        }

        $domain = strtolower($parts[1]);

        // Load all disposable domains (built-in + external file)
        $allDisposableDomains = $this->loadDisposableDomains();

        // Check against known disposable domains
        if (in_array($domain, $allDisposableDomains)) {
            \Log::warning(__('registrationvalidationservicephp336'), ['email' => $email, 'domain' => $domain]);
            return [
                'valid' => false,
                'message' => __('registrationvalidationservicephp339'),
            ];
        }

        return ['valid' => true, 'message' => ''];
    }

    /**
     * Load disposable domains from built-in list and external files
     */
    private function loadDisposableDomains(): array
    {
        // Check cache first
        $cacheKey = 'disposable_email_domains';
        $cached = cache($cacheKey);

        if ($cached !== null) {
            return $cached;
        }

        // Start with built-in domains
        $allDomains = $this->disposableEmailDomains;

        // Add domains from GitHub-imported file
        $githubFilePath = storage_path('app/disposable_email_domains.txt');
        if (file_exists($githubFilePath)) {
            $fileDomains = array_filter(array_map('trim', file($githubFilePath)));
            $fileDomains = array_map('strtolower', $fileDomains);
            $allDomains = array_merge($allDomains, $fileDomains);
        }

        // Add domains from custom/manual file (these won't be overwritten by GitHub import)
        $customFilePath = storage_path('app/disposable_email_domains_custom.txt');
        if (file_exists($customFilePath)) {
            $customDomains = array_filter(array_map('trim', file($customFilePath)));
            $customDomains = array_map('strtolower', $customDomains);
            $allDomains = array_merge($allDomains, $customDomains);
        }

        $allDomains = array_unique($allDomains);

        // Cache for 6 hours
        cache([$cacheKey => $allDomains], now()->addHours(6));

        return $allDomains;
    }

    /**
     * Add a disposable domain to the custom file (won't be overwritten by GitHub import)
     */
    public function addDisposableDomain(string $domain): bool
    {
        $domain = strtolower(trim($domain));
        if (empty($domain)) {
            return false;
        }

        // Use custom file so it won't be overwritten by GitHub import
        $filePath = storage_path('app/disposable_email_domains_custom.txt');

        // Load existing custom domains
        $domains = [];
        if (file_exists($filePath)) {
            $domains = array_filter(array_map('trim', file($filePath)));
        }

        // Add new domain if not already present
        if (!in_array($domain, $domains)) {
            $domains[] = $domain;
            file_put_contents($filePath, implode("\n", $domains));

            // Clear cache
            cache()->forget('disposable_email_domains');

            return true;
        }

        return false;
    }

    /**
     * Check if email domain has valid MX records
     */
    public function checkMxRecords(string $email): array
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return ['valid' => false, 'message' => __('registrationvalidationservicephp426')];
        }

        $domain = $parts[1];

        // Check for MX records
        $mxRecords = [];
        $hasMx = getmxrr($domain, $mxRecords);

        if (!$hasMx || empty($mxRecords)) {
            // Fallback: check if A record exists (some domains use A record for mail)
            $aRecord = gethostbyname($domain);
            if ($aRecord === $domain) {
                // No A record found either
                \Log::warning(__('registrationvalidationservicephp440'), ['email' => $email, 'domain' => $domain]);
                return [
                    'valid' => false,
                    'message' => __('registrationvalidationservicephp443'),
                ];
            }
        }

        return ['valid' => true, 'message' => ''];
    }

    /**
     * Update Tor exit nodes list (call this periodically via scheduler)
     */
    public function updateTorExitNodes(): int
    {
        try {
            $url = 'https://check.torproject.org/exit-addresses';
            $content = file_get_contents($url);

            if (!$content) {
                \Log::error(__('registrationvalidationservicephp461'));
                return 0;
            }

            $nodes = [];
            $lines = explode("\n", $content);

            foreach ($lines as $line) {
                if (str_starts_with($line, 'ExitAddress ')) {
                    $parts = explode(' ', $line);
                    if (isset($parts[1])) {
                        $nodes[] = trim($parts[1]);
                    }
                }
            }

            // Save to file
            $filePath = storage_path('app/tor_exit_nodes.txt');
            file_put_contents($filePath, implode("\n", $nodes));

            // Clear cache
            cache()->forget('tor_exit_nodes');

            return count($nodes);
        } catch (\Exception $e) {
            \Log::error(__('registrationvalidationservicephp486') . $e->getMessage());
            return 0;
        }
    }
}
