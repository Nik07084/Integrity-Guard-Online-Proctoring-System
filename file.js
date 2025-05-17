flowchart TD
    subgraph "System Diagram"
        direction LR
        subgraph "Routing & Auth"
           
            R3["Register"] --> P_Register([Register])

            R_AuthGuard{"PrivateRoute Check"}

            R_AuthGuard -- "Admin" --> AdminRoutes
            R_AuthGuard -- "User" --> UserRoutes
            R_AuthGuard -- "Not Auth" --> R3

            subgraph "Admin Routes"
                direction TB
                AdminRoutes --> P_Assessments_Admin([Assessments])
                AdminRoutes --> C_CreateAssessment([CreateAssessment])
                AdminRoutes  --> P_Reports_Admin([Reports])
            end

            subgraph "User Routes"
                direction TB
                UserRoutes  --> P_Dashboard([Dashboard])
                UserRoutes  --> P_Assessments_User([Assessments])
                UserRoutes  --> P_Reports_User([Reports])
                UserRoutes  --> C_ExamSession([ExamSession])
            end
        end

        subgraph "Core Proctoring Logic"
            subgraph "Face Detection"
                C_ExamSession --> L_WebcamSetup(["Webcam Setup"])
                L_WebcamSetup --> A["Video Stream Input"]
                
                A --> B["Frame Capture"]
                B --> C["Image Preprocessing"]
                
                C --> D["Face Detection"] --> L_EventAggregator{"Event Aggregation"}
                D --> E["Facial Landmarks"]
                
                E --> F["Head Pose Estimation"] --> L_EventAggregator{"Event Aggregation"}
                E --> G["Gaze Estimation"] --> L_EventAggregator{"Event Aggregation"}
                
            end

            subgraph "Audio Detection"
                C_ExamSession --> L_MicSetup(["Mic Setup"])
                L_MicSetup --> AudioInput["Audio Input"]
                
                AudioInput --> AudioDecoding["Audio Decoding"]
                AudioDecoding --> SignalFraming["Signal Framing"]
                
                SignalFraming --> FourierTransform["Fourier Transform"]
                FourierTransform --> SpeechDetection{"Speech Detection"}
                
                SpeechDetection --> L_EventAggregator
            end

            subgraph "Tab Detection"
                C_ExamSession --> L_TabListener(["Tab Listener"])
                L_TabListener --> L_EventAggregator
            end

            L_EventAggregator --> API_SaveEvents(["Save Events"])
            L_EventAggregator --> L_Gemini(["AI Analysis"])
            L_Gemini --> API_SaveReport(["Save Report"])
        end

        subgraph "Data Pages"
            P_Assessments_Admin,P_Assessments_User --> API_FetchAssessments
            P_Reports_Admin,P_Reports_User --> API_FetchReports
            P_Dashboard --> API_FetchDashboard
            C_CreateAssessment --> API_CreateAssessment
        end

        
        P_Register --> API_Register
    end

    
    classDef page fill:#f0f0f0,stroke:#000,stroke-width:1px, font-size:30px;
    classDef component fill:#e0e0e0,stroke:#000,stroke-width:1px, font-size:30px;
    classDef route fill:#d0d0d0,stroke:#000,stroke-width:1px,shape:hexagon, font-size:30px;
    classDef api fill:#c0c0c0,stroke:#000,stroke-width:1px,shape:parallelogram, font-size:30px;
    classDef backend fill:#b0b0b0,stroke:#000,stroke-width:1px, font-size:30px;
    classDef db fill:#a0a0a0,stroke:#000,stroke-width:1px,shape:cylinder, font-size:30px;

    class P_Home,P_Login,P_Register,P_Dashboard,P_Assessments_Admin,P_Assessments_User,P_Reports_Admin,P_Reports_User page;
    class C_ExamSession,C_CreateAssessment component;
    class R1,R2,R3,R4,R5,R6,R7,R8,R9,R10,R_AuthGuard route;
    class API_Login,API_Register,API_FetchAssessments,API_FetchReports,API_FetchDashboard,API_CreateAssessment,API_SaveEvents,API_SaveReport api;
    class B_API,B_AuthLogic,B_DataLogic backend;
    class DB db;
