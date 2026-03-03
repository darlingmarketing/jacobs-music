# Planning Guide

A professional-grade chord detection and transcription application that leverages multiple custom-trained models and advanced audio analysis to provide musicians with highly accurate chord recognition for their guitar recordings and audio files.

**Experience Qualities**: 
1. **Precise** - Multi-model approach ensures highest accuracy through ensemble predictions and confidence scoring
2. **Transparent** - Users can see model confidence scores, compare different detection approaches, and understand why certain chords were chosen
3. **Flexible** - Multiple detection modes (fast, balanced, accurate) with fine-tuning controls for different musical contexts

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This application requires sophisticated audio signal processing, multiple detection algorithms running in parallel, model comparison interfaces, and advanced post-processing capabilities for professional music transcription workflows.

## Essential Features

### Multi-Model Chord Detection Engine
- **Functionality**: Analyzes audio using three complementary approaches: HPCP-based pattern matching, harmonic spectrum analysis, and neural network inference simulation
- **Purpose**: Provides superior accuracy by combining multiple detection strategies and using ensemble voting
- **Trigger**: User clicks "Analyze with AI Models" after uploading audio
- **Progression**: Upload audio → Select detection mode → Models process in parallel → Results combined via weighted voting → Confidence scores displayed → User reviews timeline
- **Success criteria**: Detection accuracy improved by 30%+ over single-model approach, with measurable confidence scores for each segment

### AI Song Analysis & Insights
- **Functionality**: Deep analysis of song chord progressions, structure, and harmonic content using LLM intelligence
- **Purpose**: Provides musicians with professional-level insights about their songs and personalized practice recommendations
- **Trigger**: User clicks "Analyze Song with AI" on any song
- **Progression**: Select song → AI analyzes chord progressions → Detects key and complexity → Identifies patterns → Generates insights and practice tips → User reviews analysis
- **Success criteria**: Users gain actionable insights they can apply to their practice and performance

### Smart Search & Discovery
- **Functionality**: Natural language search that understands musical queries like "slow songs in the key of G" or "easy fingerstyle songs"
- **Purpose**: Makes finding the right song intuitive and fast, eliminating manual filtering
- **Trigger**: User types natural language query in smart search bar
- **Progression**: Enter query → AI parses intent → Filters songs by musical criteria → Results displayed with relevance → User selects song
- **Success criteria**: 80%+ success rate in interpreting musical queries correctly

### Intelligent Chord Suggestions
- **Functionality**: Context-aware chord progression recommendations based on current chords and music theory
- **Purpose**: Helps songwriters and arrangers explore chord options and learn common progressions
- **Trigger**: User activates suggestion widget while editing chords
- **Progression**: Edit chords → Request suggestions → AI analyzes progression → Suggests next chords → User inserts chosen chord
- **Success criteria**: Suggestions align with common progressions and sound musically appropriate

### Model Comparison Interface
- **Functionality**: Shows side-by-side results from different detection models with color-coded confidence levels
- **Purpose**: Helps users understand model disagreements and choose the best result for their context
- **Trigger**: User toggles "Compare Models" view after analysis
- **Progression**: Analysis complete → Toggle comparison mode → View model-specific timelines → Select preferred model for segments → Export combined result
- **Success criteria**: Users can visually distinguish between model outputs and manually select preferred detections

### Advanced Training Data Visualizer
- **Functionality**: Displays spectral features, HPCP profiles, and harmonic patterns used by models
- **Purpose**: Educational tool and debugging interface for understanding how models "see" the audio
- **Trigger**: User clicks "Show Analysis" on any chord segment
- **Progression**: Select segment → View spectral data → See HPCP vectors → Review confidence breakdown → Understand detection reasoning
- **Success criteria**: Users can identify why certain chords were detected and adjust parameters accordingly

### Custom Model Training Interface
- **Functionality**: Allows users to label audio segments and create custom chord profiles for specific instruments or playing styles
- **Purpose**: Enables personalization for unique timbres, alternate tunings, or specific musical genres
- **Trigger**: User switches to "Train Custom Model" tab
- **Progression**: Load training audio → Label chord segments → Extract features → Build custom profiles → Apply to new audio → Measure improvement
- **Success criteria**: Custom-trained profiles improve accuracy for user's specific use case by 20%+

### Confidence-Based Post-Processing
- **Functionality**: Automatically suggests corrections for low-confidence segments using context from surrounding high-confidence chords
- **Purpose**: Reduces manual editing by intelligently filling gaps and smoothing transitions
- **Trigger**: Runs automatically after detection or when user clicks "Auto-Improve"
- **Progression**: Initial detection → Identify low-confidence regions → Analyze harmonic context → Suggest chord corrections → User reviews and accepts
- **Success criteria**: 50% reduction in manual edits needed for typical transcriptions

## Edge Case Handling

- **Silent Passages** - Detect silence/rest periods and mark as "N.C." (No Chord) automatically
- **Polyphonic Complexity** - Flag segments with high harmonic density as "review needed" with visual indicator
- **Rapid Changes** - Minimum segment duration controls prevent over-segmentation during fast passages
- **Extended Chords** - Detection of 7ths, 9ths, sus chords through advanced harmonic analysis
- **Tuning Variance** - Pitch detection and auto-tuning correction for instruments slightly out of standard tuning
- **Multiple Instruments** - Source separation hints when multiple harmonic sources detected
- **Low Quality Audio** - Noise reduction preprocessing and quality warnings for compressed/degraded audio

## Design Direction

The design should evoke scientific precision combined with musical creativity - think waveform editors meet machine learning dashboards. The interface should feel like professional audio software (Pro Tools, Logic Pro) but with modern AI/ML visualization aesthetics. Emphasis on data visualization, real-time feedback, and confidence through transparency.

## Color Selection

A sophisticated palette inspired by audio engineering and machine learning interfaces, with emphasis on data visualization and precision.

- **Primary Color**: Deep Neural Blue `oklch(0.45 0.15 250)` - Represents AI/ML technology and analytical precision
- **Secondary Colors**: 
  - Waveform Teal `oklch(0.55 0.12 200)` for audio-related elements
  - Spectrum Purple `oklch(0.50 0.14 290)` for spectral analysis views
- **Accent Color**: Confidence Green `oklch(0.65 0.15 145)` - Highlights high-confidence detections and success states
- **Additional Accents**:
  - Warning Amber `oklch(0.70 0.15 70)` for medium-confidence warnings
  - Error Crimson `oklch(0.55 0.20 25)` for low-confidence or error states
- **Foreground/Background Pairings**:
  - Primary (Neural Blue): White text `oklch(0.98 0.01 250)` - Ratio 8.2:1 ✓
  - Accent (Confidence Green): Dark text `oklch(0.20 0.02 145)` - Ratio 7.8:1 ✓
  - Background `oklch(0.97 0.01 250)`: Foreground `oklch(0.18 0.05 250)` - Ratio 12.5:1 ✓
  - Muted `oklch(0.92 0.02 250)`: Muted-foreground `oklch(0.45 0.05 250)` - Ratio 6.1:1 ✓

## Font Selection

Typography should communicate technical precision while remaining approachable for musicians of all backgrounds - combining the clarity of code editors with the personality of creative tools.

- **Typographic Hierarchy**:
  - H1 (Page Title): "Outfit" Bold/36px/tight tracking (-0.02em) - Modern geometric sans for strong headlines
  - H2 (Section Headers): "Outfit" Semibold/24px/normal tracking
  - H3 (Card Headers): "Outfit" Medium/18px/normal tracking  
  - Body Text: "Inter" Regular/15px/relaxed line-height (1.6) - Excellent readability
  - Data/Numbers: "JetBrains Mono" Medium/14px/tabular - Monospace for aligned numerical data
  - Labels: "Inter" Medium/13px/uppercase/wide tracking (0.05em) - Clear UI labels
  - Captions: "Inter" Regular/12px/muted - Subtle helper text

## Animations

Animations should emphasize the real-time nature of audio processing and provide feedback during long-running analyses, creating a sense of active computation and precision.

- **Processing States**: Pulsing progress indicators with spectral waveform animations during analysis
- **Confidence Visualization**: Smooth color transitions from red → amber → green as confidence increases
- **Model Comparison**: Slide-in panels when switching between model views
- **Segment Selection**: Subtle scale and glow effect on hover, with ripple on click
- **Timeline Scrubbing**: Smooth playhead animation with audio waveform following
- **Feature Extraction**: Animated HPCP circular visualization showing pitch class activation
- **Success States**: Gentle bounce on completion with checkmark icon

## Component Selection

- **Components**:
  - Card for model result panels, analysis settings, and feature visualizations
  - Tabs for switching between detection modes (Fast/Balanced/Accurate) and model comparison views
  - Slider for confidence thresholds, minimum segment duration, and smoothing parameters
  - Progress for real-time analysis feedback with step descriptions
  - Select for choosing time signatures, keys, and export formats
  - Tooltip for displaying detailed confidence scores and model reasoning on hover
  - Dialog for custom model training interface
  - Badge for confidence level indicators (High/Medium/Low)
  - Separator for dividing timeline sections and model comparison panels
  - ScrollArea for long chord timelines and training data lists

- **Customizations**:
  - Custom chord timeline component with waveform background and multi-track model display
  - Circular HPCP visualizer using SVG with animated pitch class highlighting
  - Confidence heatmap overlay on timeline using gradient backgrounds
  - Spectral analyzer component with Three.js for 3D frequency visualization
  - Custom training label editor with drag-to-segment functionality

- **States**:
  - Buttons: Distinct analyzing/processing state with animated gradient, disabled state for unavailable models
  - Inputs: Focus state with blue glow matching primary color, error state with red border for invalid parameters
  - Timeline segments: Hover shows confidence tooltip, selected state with blue outline, low-confidence with amber border
  - Model cards: Active model with blue accent border, inactive with muted appearance
  
- **Icon Selection**:
  - WaveformSlash for transcription/analysis
  - Brain for AI model selection
  - ChartBar for confidence visualization
  - MagicWand for auto-correction suggestions
  - Sliders for parameter tuning
  - FlaskConical for custom training
  - CheckCircle for high confidence
  - WarningCircle for medium confidence
  - XCircle for low confidence
  - SplitVertical for model comparison view

- **Spacing**:
  - Page padding: px-6 py-8
  - Card padding: p-6 for content, p-4 for compact info
  - Section gaps: space-y-6 for major sections, space-y-4 for related groups
  - Timeline segment gaps: gap-1 for tight packing with visual separation
  - Grid layouts: gap-4 for card grids, gap-6 for major section divisions

- **Mobile**:
  - Timeline switches to vertical scrolling with stacked segments
  - Model comparison becomes tabbed instead of side-by-side
  - Spectral visualizer becomes 2D simplified view on small screens
  - Training interface uses accordion for step-by-step workflow
  - Settings panel becomes bottom sheet instead of sidebar
  - Touch-optimized segment editing with drag handles at 44px minimum
