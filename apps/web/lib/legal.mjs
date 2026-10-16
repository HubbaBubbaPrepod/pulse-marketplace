export const legal = {
  updated: '2026-10-16',
  documents: {
    privacy: {
      ru: {
        title: 'Политика конфиденциальности Pulse Marketplace',
        description:
          'Политика обработки и защиты персональных данных пользователей Pulse Marketplace.',
        sections: [
          {
            id: 'scope',
            title: 'Общие положения',
            paragraphs: [
              'Настоящая Политика конфиденциальности и обработки персональных данных (далее — «Политика») определяет цели, состав, порядок обработки и меры защиты персональных данных при использовании приложения Pulse Marketplace на сайте https://marketplace.hubba-cloud.ru/ (далее — «Сайт», «Сервис»).',
              'Оператором персональных данных является Хабибулин Даниил Олегович, самозанятый, плательщик налога на профессиональный доход (далее — «Оператор»). Реквизиты Оператора указаны в настоящем документе.',
              'Политика подготовлена с учётом Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и иных применимых нормативных правовых актов Российской Федерации. Политика является общедоступным документом и размещается на Сайте.',
              'Действие Политики распространяется на посетителей каталога, зарегистрированных пользователей, авторов модулей и лиц, направляющих обращения Оператору. Marketplace не является размещённым сервисом мониторинга и не получает метрики, процессы, сетевые соединения или журналы пользовательских серверов из Monitor и агентов.',
              'Настоящая Политика информирует Пользователя об обработке данных и сама по себе не является согласием на их обработку. Посещение Сайта не означает предоставления согласия на рекламу или иные цели, не связанные с запрошенными функциями Сервиса.',
            ],
          },
          {
            id: 'definitions',
            title: 'Основные понятия',
            paragraphs: [
              '«Пользователь» — физическое лицо, посещающее Сайт, использующее доступные функции Сервиса либо направляющее обращение Оператору.',
              '«Персональные данные» — сведения, относящиеся прямо или косвенно к определённому или определяемому физическому лицу.',
              '«Обработка персональных данных» — действия или совокупность действий с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение, использование, предоставление, блокирование, удаление и уничтожение.',
              '«Внешний провайдер» — самостоятельный сервис, участвующий в предоставлении выбранной Пользователем функции: в частности, GitHub, Google, провайдер размещения сайта или электронной почты.',
            ],
          },
          {
            id: 'data',
            title: 'Категории субъектов и состав обрабатываемых данных',
            paragraphs: [
              'В отношении зарегистрированных пользователей обрабатываются внутренний идентификатор аккаунта, отображаемое имя, роль и дата создания записи. При использовании email-входа также обрабатываются адрес электронной почты, статус его подтверждения и стойкий хеш пароля с индивидуальной солью. Открытый текст пароля не сохраняется. Регистрация и восстановление пароля по email в текущей публичной установке отключены.',
              'При использовании GitHub-входа обрабатываются идентификатор пользователя GitHub, отображаемое имя и связь с аккаунтом Marketplace. Состав Google-данных и условия их обработки определены в специальных разделах настоящей Политики. Пароли внешних провайдеров Оператору не передаются.',
              'В отношении авторов модулей обрабатываются общедоступные сведения GitHub о владельце и репозитории, релизах, исходных ссылках, манифесте, платформах и распространяемом пакете. Сохраняются результаты проверок, решения модерации, комментарии и сведения о лице, принявшем решение.',
              'Для функционирования и защиты Сервиса обрабатываются сессионные записи, временные параметры OAuth, счётчики попыток и технические сведения запросов. IP-адрес может обрабатываться сетевой инфраструктурой и присутствовать в системных журналах. Журнал HTTP-доступа virtual host Marketplace отключён.',
              'При обращении Оператору обрабатываются адрес электронной почты заявителя, текст обращения, необходимые для его рассмотрения сведения и добровольно приложенные материалы. Пользователь не должен направлять действующие пароли, ключи, токены или избыточные данные третьих лиц.',
            ],
          },
          {
            id: 'purpose',
            title: 'Цели обработки персональных данных',
            paragraphs: [
              'Обработка осуществляется для предоставления запрошенных функций Сайта, обеспечения его работоспособности, защиты от неправомерного доступа и рассмотрения обращений Пользователей.',
              'К целям обработки также относятся идентификация аккаунта, предоставление доступа к кабинету с учётом роли, проверка авторства и пакетов модулей, ведение каталога, модерация, рассмотрение жалоб и апелляций.',
              'Данные могут обрабатываться для выполнения обязанностей, установленных применимым законодательством, и защиты прав Оператора и Пользователей в предусмотренных законом случаях. Объём данных ограничивается сведениями, необходимыми для конкретной цели.',
            ],
          },
          {
            id: 'legal-basis',
            title: 'Правовые основания обработки',
            paragraphs: [
              'Оператор осуществляет обработку при наличии оснований, предусмотренных законодательством о персональных данных, в том числе когда она необходима для исполнения соглашения с Пользователем или предоставления запрошенной им функции, выполнения установленных законом обязанностей либо осуществляется на основании надлежащим образом полученного согласия.',
              'Если для конкретной обработки требуется согласие Пользователя, такое согласие оформляется отдельно от настоящей Политики и иных подтверждаемых документов. Ознакомление с Политикой не заменяет получение согласия в случаях, когда оно необходимо.',
              'Отзыв согласия прекращает обработку, основанную исключительно на таком согласии. Обработка может продолжаться при наличии самостоятельного законного основания. Если без соответствующих данных невозможно предоставить запрошенную функцию, прекращается предоставление именно этой функции, а не автоматически всего Сервиса.',
            ],
          },
          {
            id: 'google-access',
            title: 'Доступ к данным Google',
            paragraphs: [
              'Pulse Marketplace использует Google OpenID Connect только для входа в аккаунт и его явной привязки. Запрашиваемые разрешения: openid и profile. Из подтверждённого ID-токена приложение использует уникальный идентификатор Google (sub) и отображаемое имя (name, если Google его предоставил).',
              'Разрешение profile может возвращать и другие базовые сведения профиля, например ссылку на фото. Текущая реализация не сохраняет и не использует фото, дату рождения или пол. Разрешение email не запрашивается, адрес Google-почты для входа не требуется. У приложения нет доступа к Gmail, Google Drive, контактам, календарю, паролю Google или закрытым репозиториям GitHub.',
              'На время входа сервер проверяет ID-токен и параметры безопасности протокола. Долгосрочное хранение Google access token, refresh token или ID-токена в базе аккаунтов не выполняется. Идентификатор Google и имя сохраняются в базе Pulse Marketplace.',
            ],
          },
          {
            id: 'google-use',
            title: 'Использование данных Google',
            paragraphs: [
              'Идентификатор Google связывает повторные входы с одним аккаунтом Pulse Marketplace. Имя используется для отображения аккаунта в интерфейсе. Привязка к уже существующему аккаунту выполняется отдельным действием пользователя; совпадение email не объединяет аккаунты автоматически.',
              'Эти данные нужны для доступа к кабинету, разрешённым аккаунту действиям и поддержки входа. Google-вход сам по себе не доказывает владение GitHub-репозиторием: авторство модуля проверяется отдельно через GitHub.',
              'Google-данные не используются для рекламы, перепродажи, определения кредитоспособности, построения рекламных профилей или обучения моделей искусственного интеллекта. Приложение не использует Google Workspace API. Новые разрешения и другие цели обработки не вводятся без необходимого информирования и разрешения пользователя.',
            ],
          },
          {
            id: 'google-sharing',
            title: 'Предоставление и раскрытие данных Google',
            paragraphs: [
              'Google-идентификатор и привязка Google не публикуются в каталоге, не включаются в установочные JSON-пакеты и не передаются авторам модулей, Monitor или агентам. Само отображаемое имя аккаунта не используется как публичное имя владельца GitHub-модуля.',
              'Владелец сервиса может получить доступ к записям аккаунта для администрирования, защиты сервиса и рассмотрения вашего обращения. Инфраструктура сервера хранит базу и резервные копии для работы и восстановления Marketplace. Иных получателей Google-данных для рекламы, аналитики или продажи нет.',
              'Сам Google обрабатывает вход по собственной политике. Сведения могут предоставляться в объёме, который требуется применимым законом или необходим для защиты от злоупотреблений; это не разрешение на произвольную передачу данных. Обработка у внешних провайдеров может происходить за пределами вашей страны.',
            ],
          },
          {
            id: 'processing',
            title: 'Порядок и способы обработки',
            paragraphs: [
              'Обработка осуществляется с использованием средств автоматизации и без их использования: при работе программного обеспечения Сайта, рассмотрении обращений и, для Marketplace, при модерации публикаций.',
              'Оператор ограничивает обработку определёнными целями, принимает меры по уточнению недостоверных данных и предоставляет доступ к ним только в объёме, необходимом для выполнения соответствующей задачи.',
              'Специальные категории и биометрические персональные данные для работы Сервиса не запрашиваются. Пользователю не следует включать такие сведения в публичные пакеты и обращения, если они не требуются для рассмотрения конкретного вопроса.',
            ],
          },
          {
            id: 'storage',
            title: 'Cookies и локальное хранение',
            paragraphs: [
              'В браузере сохраняется выбранная тема в pulse-market.theme.v1. Для входа используется защищённая HttpOnly-cookie __Host-pulse-session сроком до 7 дней; выход отзывает текущую сессию. Cookies pulse-oauth-github и pulse-oauth-google связывают начало и завершение входа и действуют до 10 минут. Не все эти cookies присутствуют одновременно.',
            ],
          },
          {
            id: 'retention',
            title: 'Сроки хранения, прекращение обработки и уничтожение',
            paragraphs: [
              'Идентификатор Google и отображаемое имя хранятся в базе PostgreSQL Pulse Marketplace, пока они необходимы для работы аккаунта и Google-входа, если не поступил запрос на удаление или не возникло иное законное основание хранения. Порядок удаления указан в разделе об удалении Google-привязки ниже. Другие данные профиля хранятся для работы аккаунта. Сессия истекает через 7 дней, состояние OAuth — через 10 минут; просроченные записи авторизации очищаются фоновым процессом. История публикаций и модерации сохраняется для целостности каталога и рассмотрения спорных ситуаций.',
              'Резервные копии базы и пакетов создаются ежедневно. Сейчас их ротацией управляет владелец вручную: автоматический срок удаления копий не установлен. Удаление записей из основной базы само по себе не стирает уже созданные резервные копии. При запросе удаления владелец отдельно учитывает их и восстановление данных.',
            ],
          },
          {
            id: 'recipients',
            title: 'Внешние сервисы и предоставление данных',
            paragraphs: [
              'Каталог публикует владельца модуля, сведения о релизе, исходную ссылку, разрешения и одобренный пакет. Email аккаунта, хеш пароля, сессии и привязки Google не публикуются. Не включайте секреты или чужие персональные данные в распространяемый пакет.',
              'GitHub и, при включении, Google обрабатывают вход по собственным политикам. Публичные сведения репозиториев поступают через GitHub. Сервер и его хостинг обеспечивают доставку запросов; технические IP-адреса могут присутствовать в системных журналах. Журнал HTTP-доступа virtual host Marketplace отключён. Обработка у внешних провайдеров может происходить за пределами вашей страны.',
            ],
          },
          {
            id: 'protection',
            title: 'Меры защиты персональных данных',
            paragraphs: [
              'К идентификатору Google и отображаемому имени применяются те же меры защиты, что и к другим данным аккаунта. Публичный Marketplace использует HTTPS. База PostgreSQL и внутренний API слушают только локальный интерфейс сервера и не опубликованы как внешние сервисы. Доступ к действиям кабинета проверяется на сервере по сессии и роли, запросы изменения данных проверяют Origin и CSRF-токен.',
              'Cookie сессии защищена флагами Secure, HttpOnly и SameSite=Lax. В базе хранится хеш токена сессии; для email-пароля — стойкий хеш с индивидуальной солью. Для Google-входа используются PKCE, state и nonce. Серверные реквизиты и резервные копии ограничены файловыми правами. Это описание применяемых мер, а не гарантия отсутствия любых рисков.',
              'Об утечке или подозрении на доступ к чужому аккаунту сообщайте на heyhubbabubbapr@gmail.com. Не прикладывайте действующие пароли, токены или приватные ключи.',
            ],
          },
          {
            id: 'rights',
            title: 'Права Пользователя и порядок обращения',
            paragraphs: [
              'Пользователь вправе запрашивать сведения об обработке относящихся к нему персональных данных, требовать их уточнения, блокирования или уничтожения в предусмотренных законом случаях, отзывать ранее предоставленное согласие и обжаловать действия Оператора в уполномоченный орган или суд.',
              'Обращения направляются на heyhubbabubbapr@gmail.com либо support@hubba-cloud.ru. В обращении следует указать сведения, позволяющие определить заявителя и относящиеся к нему данные, суть требования и способ обратной связи. Оператор вправе запросить соразмерное подтверждение принадлежности данных заявителю.',
              'Обращения рассматриваются Оператором вручную с соблюдением применимых требований и установленных законом сроков. Фиксированный срок обычной технической поддержки и круглосуточное обслуживание не предусмотрены; это не отменяет обязательных сроков рассмотрения требований субъектов персональных данных.',
              'Удаление аккаунта, Google-привязки и сохранение лицензированных опубликованных версий рассматриваются отдельно. Пользователь вправе обратиться за удалением ненужных данных профиля; наличие опубликованного пакета само по себе не является основанием для бессрочного хранения всех сведений об аккаунте.',
            ],
          },
          {
            id: 'google-deletion',
            title: 'Порядок удаления Google-привязки и аккаунта',
            paragraphs: [
              'Чтобы удалить Google-привязку, аккаунт или связанные с ними данные, напишите на heyhubbabubbapr@gmail.com с темой «Pulse Marketplace — удаление данных». Укажите отображаемое имя и способ входа; владелец проверит принадлежность аккаунта безопасным соразмерным способом. Самостоятельной кнопки удаления сейчас нет.',
              'После подтверждения запроса владелец прекращает доступ через удаляемую привязку, отзывает затронутые сессии и удаляет либо обезличивает сведения, которые больше не нужны для предоставления сервиса или обязательного хранения. Если удаление затрагивает единственный способ входа, доступ к аккаунту будет утрачен; альтернативный способ входа нужно согласовать заранее.',
              'Удаление Google-привязки не отзывает уже выданные лицензии на опубликованные модули. Необходимая история решений может сохраняться для безопасности и рассмотрения споров с минимизацией персональных данных. Резервные копии рассматриваются отдельно при удалении и восстановлении; автоматический срок их ротации пока не настроен.',
              'Вы также можете убрать разрешение Pulse Marketplace в настройках подключений Google-аккаунта. Это действие не удаляет уже сохранённую запись из базы Marketplace: для её удаления нужно обратиться к владельцу сервиса.',
            ],
          },
          {
            id: 'obligations',
            title: 'Обязанности Оператора',
            paragraphs: [
              'Оператор обязан использовать персональные данные в пределах заявленных целей и законных оснований, обеспечивать конфиденциальность и принимать необходимые организационные и технические меры защиты.',
              'Оператор рассматривает обращения субъектов персональных данных, принимает меры по уточнению недостоверных сведений и прекращению неправомерной обработки, а также удалению либо уничтожению данных при наличии предусмотренных законом оснований.',
              'Предоставление сведений третьим лицам допускается при наличии соответствующего законного основания. Участие внешнего провайдера в выбранном Пользователем способе входа или размещении Сайта не означает разрешения на продажу данных или их использование для рекламы.',
            ],
          },
          {
            id: 'tracking',
            title: 'Аналитика и рекламные технологии',
            paragraphs: [
              'На дату настоящей редакции Google Analytics, Яндекс Метрика, рекламные пиксели и маркетинговые рассылки не применяются. Продажа персональных данных и рекламное профилирование не осуществляются. Изменение этих условий требует предварительного информирования Пользователей и наличия соответствующего законного основания.',
            ],
          },
          {
            id: 'changes',
            title: 'Изменение Политики и заключительные положения',
            paragraphs: [
              'Актуальная редакция Политики размещается по постоянному адресу страницы конфиденциальности Сайта. Дата редакции указывается в начале документа. При изменении фактического порядка обработки Оператор актуализирует текст Политики.',
              'Изменение текста Политики или продолжение использования Сайта не заменяют отдельное согласие на новую обработку, если такое согласие требуется. Ранее предоставленные открытые лицензии и обязательные права Пользователей сохраняются.',
              'Вопросы, не урегулированные Политикой, разрешаются в соответствии с применимым законодательством. Обычные обращения по Сервису направляются на support@hubba-cloud.ru, вопросы обработки данных и безопасности — на heyhubbabubbapr@gmail.com.',
            ],
          },
        ],
        numbered: true,
        showOperator: true,
      },
      en: {
        title: 'Pulse Marketplace Privacy Policy',
        description:
          'Policy governing the processing and protection of Pulse Marketplace users’ personal data.',
        sections: [
          {
            id: 'scope',
            title: 'General provisions',
            paragraphs: [
              'This Privacy and Personal Data Processing Policy (the “Policy”) establishes the purposes, categories, processing procedures and safeguards for personal data processed by the Pulse Marketplace application at https://marketplace.hubba-cloud.ru/ (the “Website” or “Service”).',
              'The personal data controller is Daniil Olegovich Khabibulin, a self-employed individual paying Russian professional income tax (the “Controller”). The Controller’s details are set out in this document.',
              'This Policy is prepared with reference to Russian Federal Law No. 152-FZ of 27 July 2006 on Personal Data and other applicable Russian legislation. It is a public document available on the Website.',
              'The Policy covers catalog visitors, registered users, module authors and persons contacting the Controller. Marketplace is not a hosted server-monitoring service and does not receive user server metrics, processes, network connections or logs from Monitor or agents.',
              'This Policy informs Users about data processing and does not itself constitute consent. Visiting the Website does not constitute consent to advertising or purposes unrelated to the requested Service functionality.',
            ],
          },
          {
            id: 'definitions',
            title: 'Definitions',
            paragraphs: [
              '“User” means an individual visiting the Website, using available Service functions or contacting the Controller.',
              '“Personal data” means information relating directly or indirectly to an identified or identifiable individual.',
              '“Processing” means operations on personal data, including collection, recording, organization, storage, correction, use, disclosure, restriction, deletion and destruction.',
              '“External provider” means a separate service involved in delivering a function chosen by the User, including GitHub, Google, website hosting and email providers.',
            ],
          },
          {
            id: 'data',
            title: 'Data subjects and categories of personal data',
            paragraphs: [
              'Registered account data comprises the internal account identifier, display name, role and creation date. Email sign-in additionally processes the email address, verification status and a strong individually salted password hash. Plaintext passwords are not stored. Email registration and recovery are disabled on the current public installation.',
              'GitHub sign-in processes the GitHub user identifier, display name and account association. Google data and its processing are described in dedicated sections of this Policy. External provider passwords are not disclosed to the Controller.',
              'Module author data includes public GitHub owner/repository details, releases, source links, manifests, platforms and distributed packages. Validation results, moderation decisions, comments and decision-maker identifiers are retained.',
              'Operating and protecting the Service involves session records, temporary OAuth parameters, attempt counters and technical request information. IP addresses may be processed by network infrastructure and appear in system logs. The Marketplace virtual host HTTP access log is disabled.',
              'Support correspondence comprises the sender’s email address, message, information necessary for handling it and voluntary attachments. Users must not submit active passwords, keys, tokens or excessive third-party personal data.',
            ],
          },
          {
            id: 'purpose',
            title: 'Purposes of processing',
            paragraphs: [
              'Personal data is processed to provide requested Website functionality, maintain operation, protect against unauthorized access and handle User requests.',
              'Processing also supports account identification, role-based workspace access, repository authorship and package validation, catalog management, moderation, complaints and appeals.',
              'Data may be processed to meet applicable legal obligations and protect Controller/User rights where permitted by law. Processing is limited to information necessary for a specified purpose.',
            ],
          },
          {
            id: 'legal-basis',
            title: 'Legal grounds',
            paragraphs: [
              'The Controller processes data where a ground under applicable data protection law exists, including necessity to perform an agreement with the User or deliver a requested function, meet legal obligations or act on validly obtained consent.',
              'Where a specific processing activity requires consent, that consent must be obtained separately from this Policy and other documents being confirmed. Reading the Policy does not replace consent where consent is required.',
              'Withdrawal ends processing based solely on that consent. Processing may continue where a separate lawful ground exists. If the data is necessary for a requested function, that function may cease; withdrawal does not automatically prohibit use of every part of the Service.',
            ],
          },
          {
            id: 'google-access',
            title: 'Access to Google data',
            paragraphs: [
              'Pulse Marketplace uses Google OpenID Connect only to sign in and explicitly link an identity. The requested scopes are openid and profile. From the verified ID token, the application uses the unique Google identifier (sub) and display name (name, if supplied by Google).',
              'The profile scope may return other basic profile information, such as a photo URL. The current implementation does not store or use the photo, date of birth or gender. The email scope is not requested and a Google email address is not required for sign-in. The application cannot access Gmail, Google Drive, contacts, calendars, your Google password or private GitHub repositories.',
              'During sign-in, the server validates the ID token and protocol security parameters. Google access tokens, refresh tokens and ID tokens are not persisted in the account database. The Google identifier and display name are stored in the Pulse Marketplace database.',
            ],
          },
          {
            id: 'google-use',
            title: 'Use of Google data',
            paragraphs: [
              'The Google identifier associates repeat sign-ins with the same Pulse Marketplace account. The name identifies the account in the interface. Linking an existing account requires a separate user action; matching emails do not automatically merge accounts.',
              'These data support workspace access, authorized account actions and sign-in support. Google sign-in alone does not establish ownership of a GitHub repository: module authorship is checked separately through GitHub.',
              'Google data is not used for advertising, resale, creditworthiness assessment, advertising profiles or training artificial intelligence models. The application does not use Google Workspace APIs. New permissions or processing purposes require the necessary notice and user authorization.',
            ],
          },
          {
            id: 'google-sharing',
            title: 'Disclosure of Google data',
            paragraphs: [
              'The Google identifier and identity link are not published in the catalog, embedded in installation JSON packages or shared with module authors, Monitor or agents. An account display name is not used as the public GitHub module owner name.',
              'The service operator may access account records for administration, service protection and your support requests. Server infrastructure stores the database and backups to operate and recover Marketplace. No other recipients receive Google data for advertising, analytics or sale.',
              'Google processes sign-in under its own privacy policy. Information may be disclosed to the extent required by applicable law or necessary to address abuse; this is not authorization for arbitrary disclosure. External providers may process data outside your country.',
            ],
          },
          {
            id: 'processing',
            title: 'Processing procedures and methods',
            paragraphs: [
              'Processing uses automated and non-automated means through Website software, handling correspondence and, for Marketplace, publication moderation.',
              'The Controller limits processing to specified purposes, takes steps to correct inaccurate data and restricts access to what is needed for the relevant task.',
              'Special-category and biometric personal data are not requested for Service operation. Users should not include such information in public packages or correspondence unless necessary to address a specific request.',
            ],
          },
          {
            id: 'storage',
            title: 'Cookies and browser storage',
            paragraphs: [
              'Your chosen theme is stored in pulse-market.theme.v1. Sign-in uses the secure HttpOnly __Host-pulse-session cookie for up to 7 days; signing out revokes the current session. The pulse-oauth-github and pulse-oauth-google cookies bind the start and completion of sign-in and last up to 10 minutes. These cookies are not necessarily all present at once.',
            ],
          },
          {
            id: 'retention',
            title: 'Retention, cessation and deletion',
            paragraphs: [
              'Google user identifiers and display names are stored in the Pulse Marketplace PostgreSQL database for as long as they are needed to maintain the account and Google sign-in, unless deletion is requested or another lawful retention ground applies. Deletion requests follow the procedure in the Google account deletion section below. Other profile data is retained to operate accounts. Sessions expire after 7 days and OAuth state after 10 minutes; a background process removes expired authentication records. Publication and moderation history is retained for catalog integrity and dispute handling.',
              'The database and packages are backed up daily. Retention is currently managed manually by the operator; automatic backup expiry has not been configured. Deleting a primary database record does not itself erase existing backups. The operator must separately account for backups and recovery when handling deletion requests.',
            ],
          },
          {
            id: 'recipients',
            title: 'External services and data disclosure',
            paragraphs: [
              'The catalog exposes module ownership, release details, source links, permissions and approved packages. Account email, password hashes, sessions and Google identity links are not published. Do not include secrets or other people’s personal data in distributed packages.',
              'GitHub and, when enabled, Google process authentication under their own policies. Public repository data is retrieved from GitHub. The server and its hosting provider deliver requests; technical IP addresses may appear in system logs. The Marketplace virtual host HTTP access log is disabled. External providers may process data outside your country.',
            ],
          },
          {
            id: 'protection',
            title: 'Personal data safeguards',
            paragraphs: [
              'Google user identifiers and display names receive the same safeguards as other account data. The public Marketplace uses HTTPS. PostgreSQL and the internal API bind only to the server loopback interface and are not exposed as public services. Workspace actions require server-side session and role checks; state-changing requests check Origin and CSRF tokens.',
              'The session cookie uses Secure, HttpOnly and SameSite=Lax. Session tokens are hashed in the database; email passwords use a strong individually salted hash. Google sign-in uses PKCE, state and nonce. File permissions restrict server credentials and backups. These are the implemented safeguards, not a guarantee that every risk is eliminated.',
              'Report suspected disclosure or unauthorized account access to heyhubbabubbapr@gmail.com. Do not attach active passwords, tokens or private keys.',
            ],
          },
          {
            id: 'rights',
            title: 'User rights and requests',
            paragraphs: [
              'Users may request information about processing of their personal data, require correction, restriction or destruction where provided by law, withdraw previously given consent and challenge the Controller’s actions before the competent authority or a court.',
              'Requests may be sent to heyhubbabubbapr@gmail.com or support@hubba-cloud.ru. Identify the requester and relevant data, specify the request and provide a reply address. The Controller may require proportionate verification that the data belongs to the requester.',
              'The Controller handles requests manually subject to applicable requirements and statutory time limits. Ordinary technical support has no fixed SLA or 24/7 availability; this does not alter mandatory data subject request deadlines.',
              'Account deletion, removal of a Google identity and retention of licensed published releases are assessed separately. Users may request deletion of unnecessary profile data; publication alone does not justify indefinite retention of every account detail.',
            ],
          },
          {
            id: 'google-deletion',
            title: 'Deletion of a Google identity and account',
            paragraphs: [
              'To delete a Google identity link, account or associated data, email heyhubbabubbapr@gmail.com with the subject “Pulse Marketplace — data deletion”. Include the display name and sign-in method; the operator verifies account ownership in a safe and proportionate way. There is currently no self-service deletion button.',
              'After verifying the request, the operator disables the identity being removed, revokes affected sessions and deletes or anonymizes information no longer required to provide the service or meet mandatory retention obligations. Removing the only sign-in method loses account access; arrange an alternative sign-in method beforehand if needed.',
              'Deleting a Google identity link does not revoke licenses already granted for published modules. Necessary decision history may be retained for security and disputes with personal data minimized. Backups are considered separately during deletion and recovery; automatic backup rotation is not yet configured.',
              [
                'You can also remove Pulse Marketplace access in your ',
                {
                  text: 'Google Account connections settings',
                  href: 'https://myaccount.google.com/connections',
                },
                '. Doing so does not erase the record already stored in Marketplace: contact the operator to request its deletion.',
              ],
            ],
          },
          {
            id: 'obligations',
            title: 'Controller obligations',
            paragraphs: [
              'The Controller must use personal data within the stated purposes and lawful grounds, maintain confidentiality and implement necessary organizational and technical safeguards.',
              'The Controller handles data subject requests, corrects inaccurate information, addresses unlawful processing and deletes or destroys information where a legal ground requires it.',
              'Disclosure to third parties requires an appropriate lawful ground. An external provider’s participation in sign-in or hosting does not authorize sale of data or advertising use.',
            ],
          },
          {
            id: 'tracking',
            title: 'Analytics and advertising technologies',
            paragraphs: [
              'As of this revision, Google Analytics, Yandex Metrica, advertising pixels and marketing mailings are not used. Personal data is not sold or used for advertising profiles. Changes require advance User notice and an appropriate lawful ground.',
            ],
          },
          {
            id: 'changes',
            title: 'Amendments and final provisions',
            paragraphs: [
              'The current Policy is published at the Website’s permanent privacy policy URL. Its revision date appears at the beginning. The Controller updates the Policy when actual processing practices change.',
              'Replacing this text or continuing to use the Website does not replace separate consent to new processing where consent is required. Existing open-source licenses and mandatory User rights remain unaffected.',
              'Matters not addressed in this Policy are governed by applicable law. Ordinary Service requests may be sent to support@hubba-cloud.ru; personal data and security requests to heyhubbabubbapr@gmail.com.',
            ],
          },
        ],
        numbered: true,
        showOperator: true,
      },
    },
    terms: {
      ru: {
        title: 'Условия использования',
        description:
          'Условия бесплатного использования Pulse Marketplace, лицензии, ответственность и обращения.',
        sections: [
          {
            id: 'operator',
            title: 'Сервис и владелец',
            paragraphs: [
              'Pulse Marketplace предоставляет самозанятый Хабибулин Даниил Олегович, Россия. Связь: support@hubba-cloud.ru, резервный адрес — heyhubbabubbapr@gmail.com. Эти условия относятся к сайту; использование исходного кода регулируется отдельными лицензиями.',
            ],
          },
          {
            id: 'free',
            title: 'Бесплатный доступ',
            paragraphs: [
              'Сервис сейчас бесплатный: подписки, платежи и комиссия за скачивание не взимаются. Расходы на собственные серверы и сторонние сервисы пользователь несёт самостоятельно. Введение платных функций потребует отдельных явно изложенных условий; эти условия не разрешают автоматическое списание денег.',
            ],
          },
          {
            id: 'use',
            title: 'Использование и доступ',
            paragraphs: [
              'Просматривать каталог и скачивать одобренные пакеты можно без аккаунта. Для кабинета автора и действий с публикациями необходим вход. Вы отвечаете за доступ к своему аккаунту и не должны выдавать себя за другого автора. Общий email провайдера не служит основанием для автоматического объединения аккаунтов.',
            ],
          },
          {
            id: 'licenses',
            title: 'Лицензии и права',
            paragraphs: [
              'Код основных проектов Pulse опубликован под MIT; условия конкретного репозитория имеют значение. Сторонние модули и зависимости могут иметь другие открытые лицензии. Проверяйте LICENSE, уведомления об авторстве и ограничения перед использованием и распространением. Эти условия не заменяют и не отзывают уже предоставленные права по лицензиям.',
            ],
          },
          {
            id: 'modules',
            title: 'Публикации и сохранение версий',
            paragraphs: [
              [
                'Для Marketplace действуют отдельные ',
                { text: 'правила публикации и модерации', document: 'rules' },
                '. Публикуйте только материалы, на распространение которых у вас есть права. Лицензированный пакет может сохраняться в каталоге после удаления аккаунта автора; это не лишает автора прав и не отменяет требований о защите персональных данных.',
              ],
              'Одобрение означает решение по конкретному пакету, а не гарантию безопасности. Перед установкой изучите код, требуемый доступ и совместимость. Модуль с доступом к Docker или системе может иметь широкие полномочия.',
            ],
          },
          {
            id: 'conduct',
            title: 'Допустимое поведение',
            paragraphs: [
              'Нельзя нарушать права других людей, распространять вредоносные пакеты, скрывать передачу данных, подменять авторство или мешать работе сайта. Владелец может ограничить доступ или отозвать публикацию для защиты сервиса и пользователей, с учётом обстоятельств и применимых требований. Решение можно обжаловать по контактам поддержки.',
            ],
          },
          {
            id: 'availability',
            title: 'Доступность и ответственность',
            paragraphs: [
              'Проект предоставляется без обещания непрерывной доступности, совместимости с любой системой или отсутствия ошибок. Круглосуточная поддержка и гарантированное время ответа не предусмотрены. Пользователь отвечает за резервные копии и проверку программ в своей инфраструктуре.',
              'Ограничения гарантий и ответственности действуют только в пределах, разрешённых применимым законодательством. Эти условия не исключают ответственность и права пользователя, которые нельзя исключить договором.',
            ],
          },
          {
            id: 'requests',
            title: 'Данные, изменения и обращения',
            paragraphs: [
              [
                'Обработка данных описана в ',
                { text: 'политике конфиденциальности', document: 'privacy' },
                '. Для удаления аккаунта или сведений напишите на heyhubbabubbapr@gmail.com; для жалобы на модуль или апелляции — на support@hubba-cloud.ru. При изменении условий дата редакции обновляется. Новые условия не отменяют ранее выданные открытые лицензии и обязательные права пользователей.',
              ],
            ],
          },
        ],
        numbered: true,
        showOperator: true,
      },
      en: {
        title: 'Terms of service',
        description:
          'Terms for using Pulse Marketplace, including free access, software licensing, responsibilities and support.',
        sections: [
          {
            id: 'operator',
            title: 'Service and operator',
            paragraphs: [
              'Pulse Marketplace is operated by Daniil Olegovich Khabibulin (Хабибулин Даниил Олегович), a self-employed individual in Russia. Contact support@hubba-cloud.ru, or heyhubbabubbapr@gmail.com if delivery fails. These terms cover the website; software use is governed by its separate licenses.',
            ],
          },
          {
            id: 'free',
            title: 'Free access',
            paragraphs: [
              'The service is currently free, with no subscription, payment or download commission. Users pay for their own infrastructure and external services. Paid features would require separate explicit terms; these terms do not authorize automatic charges.',
            ],
          },
          {
            id: 'use',
            title: 'Use and access',
            paragraphs: [
              'The catalog and approved downloads are public. Author workspaces and publication actions require sign-in. You are responsible for account access and must not impersonate another author. Matching provider emails do not automatically merge accounts.',
            ],
          },
          {
            id: 'licenses',
            title: 'Licenses and rights',
            paragraphs: [
              'The core Pulse projects use MIT; consult the specific repository license. Third-party modules and dependencies may use other open-source licenses. Review LICENSE files, attribution requirements and restrictions before use or redistribution. These terms do not replace or revoke rights already granted under those licenses.',
            ],
          },
          {
            id: 'modules',
            title: 'Publications and retained versions',
            paragraphs: [
              [
                'Separate ',
                { text: 'publishing and moderation rules', document: 'rules' },
                ' apply to Marketplace. Publish only material you are entitled to distribute. Licensed packages may remain in the catalog after an author account is deleted; this does not remove authorship rights or override personal data requirements.',
              ],
              'Approval is a decision about an exact package, not a security guarantee. Review the code, permissions and compatibility before installation. Modules with Docker or system access may have extensive privileges.',
            ],
          },
          {
            id: 'conduct',
            title: 'Acceptable behavior',
            paragraphs: [
              'Do not violate others’ rights, distribute malicious packages, conceal data transfers, impersonate authors or disrupt the site. The operator may restrict access or withdraw publications to protect the service and users, taking circumstances and applicable requirements into account. Decisions can be appealed through support.',
            ],
          },
          {
            id: 'availability',
            title: 'Availability and responsibility',
            paragraphs: [
              'The project makes no promise of continuous availability, compatibility with every system or error-free operation. There is no 24/7 support or guaranteed response time. Users are responsible for backups and testing software in their own infrastructure.',
              'Warranty and liability limitations apply only to the extent permitted by applicable law. These terms do not exclude liability or user rights that cannot lawfully be excluded.',
            ],
          },
          {
            id: 'requests',
            title: 'Data, changes and requests',
            paragraphs: [
              [
                'Data processing is described in ',
                { text: 'the privacy policy', document: 'privacy' },
                '. For account/data deletion, email heyhubbabubbapr@gmail.com; for module complaints or appeals, contact support@hubba-cloud.ru. Changes update the revision date. New terms do not revoke existing open-source licenses or mandatory user rights.',
              ],
            ],
          },
        ],
        numbered: true,
        showOperator: true,
      },
    },
    contacts: {
      ru: {
        title: 'Контакты и обращения',
        description:
          'Кто управляет Pulse, куда писать за поддержкой, по вопросам данных, жалоб и апелляций.',
        sections: [
          {
            id: 'operator',
            title: 'Сведения об Операторе',
            paragraphs: [
              'Владельцем Сервиса и оператором персональных данных является Хабибулин Даниил Олегович — самозанятый, плательщик налога на профессиональный доход, Российская Федерация (далее — «Оператор»). ИНН, адрес и контактные данные Оператора приведены в разделе реквизитов настоящей страницы. Pulse является независимым проектом с открытым исходным кодом. Упоминание GitHub, Google и Docker не означает участия указанных организаций в управлении Сервисом или одобрения ими проекта.',
            ],
          },
          {
            id: 'support',
            title: 'Поддержка и жалобы',
            paragraphs: [
              'По работе сайта, модулей, жалобам на публикации и обжалованию решений: support@hubba-cloud.ru. Укажите ссылку на страницу или модуль, версию, описание ситуации и ожидаемый результат. Если письмо не доставляется, используйте heyhubbabubbapr@gmail.com.',
            ],
          },
          {
            id: 'privacy',
            title: 'Персональные данные',
            paragraphs: [
              'Для доступа к своим данным, исправления, удаления аккаунта или прекращения обработки: heyhubbabubbapr@gmail.com. Укажите способ входа и идентификатор аккаунта. Для защиты от чужих запросов может потребоваться подтверждение владения аккаунтом. Не отправляйте пароль, ключи или копию паспорта без отдельной обоснованной необходимости. Запросы обрабатываются владельцем вручную.',
            ],
          },
          {
            id: 'availability',
            title: 'Порядок рассмотрения обращений',
            paragraphs: [
              'Рассмотрение обращений, техническую поддержку и модерацию осуществляет Оператор. Сервис предоставляется бесплатно. Круглосуточная поддержка и фиксированный срок ответа на обычные обращения не предусмотрены. Обращения, для которых законодательством установлены обязательные сроки, рассматриваются в пределах таких сроков. Сообщения об уязвимостях направляются на heyhubbabubbapr@gmail.com с темой «Pulse security».',
            ],
          },
        ],
        showOperator: true,
      },
      en: {
        title: 'Contact and requests',
        description:
          'Who operates Pulse and how to contact support, request data deletion or appeal a moderation decision.',
        sections: [
          {
            id: 'operator',
            title: 'Service operator',
            paragraphs: [
              'The Service owner and personal data controller is Daniil Olegovich Khabibulin (Хабибулин Даниил Олегович), a self-employed individual and payer of Russian professional income tax in the Russian Federation (the “Controller”). The Controller’s tax identification number, address and contact details appear in the particulars section on this page. Pulse is an independent open-source project. References to GitHub, Google and Docker do not imply that these organizations operate, sponsor or endorse the Service.',
            ],
          },
          {
            id: 'support',
            title: 'Support and complaints',
            paragraphs: [
              'For website/module support, publication complaints and moderation appeals: support@hubba-cloud.ru. Include a page or module link, version, explanation and requested outcome. If delivery fails, use heyhubbabubbapr@gmail.com.',
            ],
          },
          {
            id: 'privacy',
            title: 'Personal data',
            paragraphs: [
              'For access, correction, account deletion or requests to stop processing, email heyhubbabubbapr@gmail.com. State your sign-in method and account identifier. Account ownership may need to be verified to prevent unauthorized requests. Do not send passwords, keys or identity documents without a separate justified need. The operator handles requests manually.',
            ],
          },
          {
            id: 'availability',
            title: 'Response availability',
            paragraphs: [
              'The project is free and support/moderation are handled by its operator. There is no 24/7 support or guaranteed response time. Applicable statutory deadlines are unaffected. For vulnerabilities, email heyhubbabubbapr@gmail.com with the subject “Pulse security”.',
            ],
          },
        ],
        showOperator: true,
      },
    },
    security: {
      ru: {
        title: 'Сообщить об уязвимости',
        description:
          'Как безопасно сообщить об уязвимости Pulse, утечке или подозрительном модуле.',
        sections: [
          {
            id: 'report',
            title: 'Приватное сообщение',
            paragraphs: [
              'Напишите на heyhubbabubbapr@gmail.com с темой «Pulse security». Для подозрительного модуля укажите владельца, ID, версию, ссылку и SHA-256, если он известен. При подозрении на вредоносный модуль прекратите его использование.',
            ],
          },
          {
            id: 'details',
            title: 'Что приложить',
            paragraphs: [
              'Опишите затронутый компонент и версию, условия воспроизведения, ожидаемый и фактический результат. Минимальный пример и обезличенные журналы помогут проверить сообщение. Не публикуйте действующие секреты или чужие персональные данные в публичном issue.',
            ],
          },
          {
            id: 'testing',
            title: 'Проверяйте на своей установке',
            paragraphs: [
              'Воспроизводите проблему в принадлежащей вам тестовой среде. Эта страница не даёт разрешения на проверку чужих серверов, перебор паролей, выгрузку данных, отказ в обслуживании или изменение чужих модулей. Для проверки публичного сервиса заранее согласуйте границы с владельцем.',
            ],
          },
          {
            id: 'handling',
            title: 'После сообщения',
            paragraphs: [
              'Владелец проверит сведения и при необходимости запросит уточнения. Опасную публикацию можно отозвать из каталога; это не удаляет копии, которые пользователи уже скачали. Вознаграждение, круглосуточное реагирование и фиксированный срок исправления не обещаются.',
            ],
          },
        ],
      },
      en: {
        title: 'Report a vulnerability',
        description:
          'How to privately report a Pulse vulnerability, exposed secret or suspicious module.',
        sections: [
          {
            id: 'report',
            title: 'Private reporting',
            paragraphs: [
              'Email heyhubbabubbapr@gmail.com with the subject “Pulse security”. For suspicious modules, include the owner, ID, version, URL and SHA-256 if known. Stop using a module you suspect is malicious.',
            ],
          },
          {
            id: 'details',
            title: 'What to include',
            paragraphs: [
              'Describe the affected component/version, reproduction conditions and expected versus actual behavior. A minimal example and redacted logs help verification. Do not post active secrets or other people’s personal data in a public issue.',
            ],
          },
          {
            id: 'testing',
            title: 'Use your own test installation',
            paragraphs: [
              'Reproduce issues in a test environment you own. This page does not authorize testing other people’s servers, password guessing, data extraction, denial of service or changes to their modules. Agree on scope with the operator before testing the public service.',
            ],
          },
          {
            id: 'handling',
            title: 'After reporting',
            paragraphs: [
              'The operator reviews reports and may ask for clarification. Unsafe publications can be withdrawn from the catalog; this does not remove copies already downloaded by users. No bounty, around-the-clock response or fixed remediation deadline is promised.',
            ],
          },
        ],
      },
    },
    rules: {
      ru: {
        title: 'Правила публикации и модерации',
        description:
          'Требования к открытым модулям Pulse, проверки, жалобы, отзывы версий и апелляции.',
        sections: [
          {
            id: 'source',
            title: 'Открытый код и лицензия',
            paragraphs: [
              'Публикуйте исходный код модуля в публичном GitHub-репозитории с явно указанной лицензией, допускающей использование, изучение, изменение и распространение кода. Наличие публичного репозитория само по себе не заменяет лицензию. Укажите лицензии зависимостей и сохраните обязательные уведомления об авторстве.',
            ],
          },
          {
            id: 'package',
            title: 'Пакет и разрешения',
            paragraphs: [
              'Релиз должен соответствовать опубликованному протоколу Pulse, содержать установочный JSON, сведения о версии, поддерживаемых платформах и необходимых разрешениях. Исходный код должен соответствовать распространяемой сборке. Объясняйте доступ к Docker socket, файлам, сети и повышенным привилегиям; раскрывайте внешние подключения и отправку данных.',
            ],
          },
          {
            id: 'discovery',
            title: 'Обнаружение и проверка',
            paragraphs: [
              'Marketplace обнаруживает репозитории по topic pulse-module и маркеру протокола. Проверка формата, платформ и контрольных сумм не публикует модуль автоматически: версия поступает на модерацию. Текущая реализация поддерживает персональные репозитории GitHub; публикация от организаций пока не поддерживается.',
            ],
          },
          {
            id: 'decisions',
            title: 'Решения модератора',
            paragraphs: [
              'Модерацию выполняет владелец проекта. Он может одобрить, отклонить или отозвать версию с объяснением причины. Модератор с ролью moderator не может одобрить собственный модуль; администратор может сделать это с записью в журнал аудита. Одобрение не означает независимый аудит, отсутствие уязвимостей или гарантию совместимости с любой системой.',
            ],
          },
          {
            id: 'prohibited',
            title: 'Что не допускается',
            paragraphs: [
              'Не допускаются скрытая отправка данных, кража учётных данных, бэкдоры, вредоносные функции, подмена пакета или владельца, нераскрытый майнинг, нарушение чужих лицензий и прав, ложные заявления о проверках и обход ограничений каталога. Законные средства администрирования и безопасности оцениваются по заявленному назначению, прозрачности и поведению.',
            ],
          },
          {
            id: 'retention',
            title: 'Версии и удаление аккаунта',
            paragraphs: [
              'Одобренные пакеты сохраняются как снимки по SHA-256. Удаление аккаунта не означает автоматическое удаление опубликованных версий: они могут оставаться доступными по условиям их лицензий, с необходимым указанием авторства. Это не даёт права бессрочно хранить ненужные данные профиля. Требования об удалении персональных данных и нарушения прав рассматриваются отдельно.',
            ],
          },
          {
            id: 'appeals',
            title: 'Жалобы и апелляции',
            paragraphs: [
              'Напишите на support@hubba-cloud.ru, при недоставке — heyhubbabubbapr@gmail.com. Укажите модуль, версию, решение или нарушение, доказательства и желаемое действие. Решение можно обжаловать с новыми фактами или объяснением ошибки. Жалобу и апелляцию рассматривает тот же владелец: отдельной независимой комиссии нет. Фиксированный срок ответа не установлен, кроме обязательных по закону сроков.',
            ],
          },
          {
            id: 'withdrawal',
            title: 'Отзыв и новые версии',
            paragraphs: [
              'При выявлении угрозы, подмены или нарушения прав версия может быть скрыта или отозвана. Старые скачанные копии автоматически не удаляются и не отключаются. Изменённый пакет требует отдельной проверки; прежнее одобрение не распространяется на новые байты.',
            ],
          },
        ],
      },
      en: {
        title: 'Publishing and moderation rules',
        description:
          'Requirements for open-source Pulse modules, review checks, complaints, withdrawals and appeals.',
        sections: [
          {
            id: 'source',
            title: 'Source and license',
            paragraphs: [
              'Publish module source in a public GitHub repository with an explicit license allowing use, study, modification and redistribution. A public repository alone is not a license. Identify dependency licenses and preserve required attribution notices.',
            ],
          },
          {
            id: 'package',
            title: 'Package and permissions',
            paragraphs: [
              'Releases must follow the published Pulse protocol and include an installation JSON, version, supported platforms and required permissions. Distributed builds must correspond to the published source. Explain access to Docker sockets, files, networks and elevated privileges; disclose external connections and data transfers.',
            ],
          },
          {
            id: 'discovery',
            title: 'Discovery and validation',
            paragraphs: [
              'Marketplace discovers repositories using the pulse-module topic and protocol marker. Passing format, platform and digest validation does not automatically publish a module: the revision enters moderation. The current implementation supports personally owned GitHub repositories; organization publishing is not yet supported.',
            ],
          },
          {
            id: 'decisions',
            title: 'Moderation decisions',
            paragraphs: [
              'The project operator moderates revisions and may approve, reject or withdraw them with a reason. A moderator-role user cannot approve their own module; an administrator can do so with an audit record. Approval is not an independent audit, a guarantee of vulnerability-free code or a promise of compatibility with every system.',
            ],
          },
          {
            id: 'prohibited',
            title: 'Disallowed content',
            paragraphs: [
              'Hidden data transfers, credential theft, backdoors, malicious behavior, package/owner impersonation, undisclosed mining, rights or license violations, false verification claims and catalog restriction bypasses are prohibited. Legitimate administration and security tools are assessed by their stated purpose, transparency and behavior.',
            ],
          },
          {
            id: 'retention',
            title: 'Versions and account deletion',
            paragraphs: [
              'Approved packages are retained as SHA-256 snapshots. Deleting an account does not automatically delete published versions: they may remain available under their licenses with required attribution. This does not authorize indefinite retention of unnecessary profile data. Personal data deletion requests and rights complaints are considered separately.',
            ],
          },
          {
            id: 'appeals',
            title: 'Complaints and appeals',
            paragraphs: [
              'Email support@hubba-cloud.ru, or heyhubbabubbapr@gmail.com if delivery fails. Identify the module, version, decision or violation, evidence and requested action. Decisions can be appealed with new facts or an explanation of an error. The same operator handles appeals; there is no independent appeals panel. There is no fixed response SLA, without affecting legally required deadlines.',
            ],
          },
          {
            id: 'withdrawal',
            title: 'Withdrawal and new releases',
            paragraphs: [
              'A version may be hidden or withdrawn for security threats, tampering or rights violations. Previously downloaded copies are not automatically removed or disabled. Changed packages require a new review; earlier approval does not cover new bytes.',
            ],
          },
        ],
      },
    },
  },
  labels: {
    ru: {
      eyebrow: 'PULSE / ДОКУМЕНТЫ',
      updated: 'Редакция от 16 октября 2026',
      contents: 'На этой странице',
      navigation: 'Документы и контакты',
      contact: 'Связаться с владельцем',
    },
    en: {
      eyebrow: 'PULSE / DOCUMENTS',
      updated: 'Updated October 16, 2026',
      contents: 'On this page',
      navigation: 'Policies and contacts',
      contact: 'Contact the operator',
    },
  },
  operator: {
    ru: {
      title: 'Оператор персональных данных',
      name: 'Хабибулин Даниил Олегович',
      status: 'Самозанятый, плательщик налога на профессиональный доход',
      taxLabel: 'ИНН',
      addressLabel: 'Адрес',
      address: '461332, Крючковка, село Луговая, улица 5, 4',
      contactLabel: 'Обращения по персональным данным',
    },
    en: {
      title: 'Personal data controller',
      name: 'Daniil Olegovich Khabibulin (Хабибулин Даниил Олегович)',
      status: 'Self-employed individual, payer of Russian professional income tax',
      taxLabel: 'Russian tax identification number (INN)',
      addressLabel: 'Address as provided by the controller',
      address: '461332, Крючковка, село Луговая, улица 5, 4',
      contactLabel: 'Personal data requests',
    },
    taxId: '562361007144',
    privacyEmail: 'heyhubbabubbapr@gmail.com',
    supportEmail: 'support@hubba-cloud.ru',
  },
};
