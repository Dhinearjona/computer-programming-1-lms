<?php
require_once "db.php";
session_start();

// ---- Auth helpers ----
$loggedIn = isset($_SESSION['user']);

// ---- Ensure upload dir ----
$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) { @mkdir($uploadDir, 0777, true); }

// ---- Minimal router ----
$page = $_GET['page'] ?? 'dashboard';
$role = $_SESSION['user']['role'] ?? null;

// ---- Handle logout (query action) ----
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
  session_unset();
  session_destroy();
  header('Location: ?page=login');
  exit;
}

// ---- Helpers ----
function h($s){ return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8'); }
function save_json($path, $data){ file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT)); }
function load_json($path){ return is_file($path) ? json_decode(file_get_contents($path), true) : []; }

// ---- UI helper: render simple inline SVG icons ----
function render_icon($name, $size=16){
  $icons = [
    'dashboard' => '<svg width="'.$size.'" height="'.$size.'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" fill="currentColor"/></svg>',
    'uploads'   => '<svg width="'.$size.'" height="'.$size.'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l4 4h-3v6h-2V7H8l4-4Zm-7 9h2v8h14v-8h2v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9Z" fill="currentColor"/></svg>',
    'quiz'      => '<svg width="'.$size.'" height="'.$size.'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h12a2 2 0 0 1 2 2v10l-4-3H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="currentColor"/></svg>',
    'activity'  => '<svg width="'.$size.'" height="'.$size.'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z" fill="currentColor"/></svg>',
    'exams'     => '<svg width="'.$size.'" height="'.$size.'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3h8l1 2h3v2H4V5h3l1-2Zm-4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Zm4 3v2h8v-2H8Z" fill="currentColor"/></svg>',
    'knn'       => '<svg width="'.$size.'" height="'.$size.'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 19V5h2v14H4Zm4-6V5h2v8H8Zm4 4V5h2v12h-2Zm4-8V5h2v4h-2Z" fill="currentColor"/></svg>',
    'lessons'   => '<svg width="'.$size.'" height="'.$size.'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm9 0v3h3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" stroke-width="2"/></svg>',
  ];
  return $icons[$name] ?? $icons['dashboard'];
}

// ---- Quiz/Activity/Exam storage (JSON for blueprint) ----
$store = __DIR__ . '/store';
if (!is_dir($store)) { @mkdir($store, 0777, true); }
$quizFile = $store.'/quiz.json';
$actFile  = $store.'/activity.json';
$examFile = $store.'/exams.json';
$lessonFile = $store.'/lessons.json';
// Student submission stores
$quizSubFile = $store.'/submissions_quiz.json';
$examSubFile = $store.'/submissions_exam.json';
$activitySubFile = $store.'/submissions_activity.json';

// ---- Handle POST actions ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

  // ---- Login ----
if (isset($_POST['do_login'])) {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $role     = in_array($_POST['role'] ?? 'teacher', ['teacher','student']) ? $_POST['role'] : 'teacher';

    if ($username !== '' && $password !== '') {
        // Check user from DB with PDO
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND role = ? LIMIT 1");
        $stmt->execute([$username, $role]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            // Verify password (plain text check for now)
            // ⚡ If you later use password_hash(), replace with password_verify()
            if ($password === $row['password']) {
                $_SESSION['user'] = [
                    'id'   => $row['id'],
                    'name' => $row['username'],
                    'role' => $row['role']
                ];
                $_SESSION['flash'] = 'Welcome back, ' . htmlspecialchars($row['username'], ENT_QUOTES, 'UTF-8') . '.';

                if ($row['role'] === 'student') {
                    header('Location: student_portal.php');
                } else {
                    header('Location: ?page=dashboard');
                }
                exit;
            } else {
                $_SESSION['flash'] = 'Invalid password. Please try again.';
            }
        } else {
            $_SESSION['flash'] = 'User not found.';
        }
    } else {
        $_SESSION['flash'] = 'Please enter username and password.';
    }

    header('Location: ?page=login');
    exit;
}

  // File uploads (CSV or PDF as example)
  if (isset($_POST['upload_type'])) {
    $type = $_POST['upload_type']; // quiz|activity|exam|dataset
    if (!empty($_FILES['file']['name'])) {
      $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
      $safe = preg_replace('/[^a-z0-9_\-\.]/i','_', $_FILES['file']['name']);
      $target = $uploadDir . '/' . time() . '_' . $safe;
      if (move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
        $_SESSION['flash'] = "Uploaded $type file: ".basename($target);
        // If dataset, remember last path for KNN page
        if ($type === 'dataset') { $_SESSION['last_dataset'] = $target; }
      } else {
        $_SESSION['flash'] = "Upload failed.";
      }
    }
    header("Location: ?page=uploads");
    exit;
  }

  // Student submissions (demo-friendly)
  if (isset($_POST['student_submit'])) {
    $kind = $_POST['kind'] ?? '';
    $student = trim($_POST['student_name'] ?? 'Student');
    $payload = [
      'id' => uniqid(),
      'student' => $student,
      'created_at' => date('c')
    ];
    if ($kind === 'quiz') {
      $payload['quiz_id'] = $_POST['quiz_id'] ?? '';
      $payload['answers'] = array_map('trim', $_POST['answers'] ?? []);
      $data = load_json($quizSubFile); $data[] = $payload; save_json($quizSubFile, $data);
      $_SESSION['flash'] = 'Quiz submitted.';
      header('Location: ?page=student'); exit;
    }
    if ($kind === 'exam') {
      $payload['exam_id'] = $_POST['exam_id'] ?? '';
      $payload['answers'] = array_map('trim', $_POST['answers'] ?? []);
      $data = load_json($examSubFile); $data[] = $payload; save_json($examSubFile, $data);
      $_SESSION['flash'] = 'Exam submitted.';
      header('Location: ?page=student'); exit;
    }
    if ($kind === 'activity') {
      $payload['activity_id'] = $_POST['activity_id'] ?? '';
      $payload['file_path'] = '';
      if (!empty($_FILES['activity_file']['name'])) {
        $safe = preg_replace('/[^a-z0-9_\-\.]/i','_', $_FILES['activity_file']['name']);
        $target = $uploadDir . '/' . time() . '_' . $safe;
        if (@move_uploaded_file($_FILES['activity_file']['tmp_name'], $target)) {
          $payload['file_path'] = $target;
        }
      }
      $data = load_json($activitySubFile); $data[] = $payload; save_json($activitySubFile, $data);
      $_SESSION['flash'] = 'Activity submitted.';
      header('Location: ?page=student'); exit;
    }
  }

  // Create quiz / activity / exam (MySQL instead of JSON)
if (isset($_POST['create_item'])) {
    $title = trim($_POST['title'] ?? '');
    $desc  = trim($_POST['desc'] ?? '');
    $max_score = (int)($_POST['max_score'] ?? 100);
    $created_at = date('Y-m-d H:i:s');
    $author = $_SESSION['user']['name'] ?? 'Teacher';

    if ($page === 'activity') {
        // For activity we save extra fields
        $allow_from = $_POST['allow_from'] ?: null;
        $due_date   = $_POST['due_date'] ?: null;
        $cut_off_date = $_POST['cut_off_date'] ?: null;
        $remind_date  = $_POST['remind_date'] ?: null;
        $submission_types = isset($_POST['submission_types']) ? implode(",", $_POST['submission_types']) : '';

        // Optional file upload
        $filePath = null;
        if (!empty($_FILES['file_upload']['name'])) {
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $safe = preg_replace('/[^a-z0-9_\-\.]/i', '_', $_FILES['file_upload']['name']);
            $target = $uploadDir . time() . '_' . $safe;
            if (move_uploaded_file($_FILES['file_upload']['tmp_name'], $target)) {
                $filePath = 'uploads/' . basename($target);
            }
        }

        // ✅ Use PDO here instead of mysqli
        $stmt = $pdo->prepare("
            INSERT INTO activities 
            (title, max_score, description, allow_from, due_date, cut_off_date, remind_date, submission_types, file_path, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $title,
            $max_score,
            $desc,
            $allow_from,
            $due_date,
            $cut_off_date,
            $remind_date,
            $submission_types,
            $filePath
        ]);

        $_SESSION['flash'] = "Activity created: " . h($title);
        header("Location: ?page=activity");
        exit;
    }

    // You can keep quizzes and exams in JSON for now (until we migrate them too)
    if ($page === 'quiz' || $page === 'exams') {
        $payload = [
          'id' => uniqid(),
          'title' => $title,
          'desc'  => $desc,
          'max_score' => $max_score,
          'questions' => array_filter(array_map('trim', $_POST['questions'] ?? [])),
          'created_at' => $created_at,
          'author' => $author
        ];
        $targetFile = ($page === 'quiz') ? $quizFile : $examFile;
        $data = load_json($targetFile);
        $data[] = $payload;
        save_json($targetFile, $data);
        $_SESSION['flash'] = ucfirst(rtrim($page,'s'))." created: ".h($title);
        header("Location: ?page=$page");
        exit;
    }
}

  // Create lesson
  if (isset($_POST['create_lesson'])) {
    $lesson = [
      'id' => uniqid(),
      'title' => trim($_POST['title'] ?? ''),
      'summary' => trim($_POST['summary'] ?? ''),
      'content' => trim($_POST['content'] ?? ''),
      'pdf_path' => '',
      'created_at' => date('c'),
      'author' => $_SESSION['user']['name'] ?? 'Teacher'
    ];
    if ($lesson['title'] === '') {
      $_SESSION['flash'] = 'Lesson title is required.';
      header('Location: ?page=lessons');
      exit;
    }
    // Optional PDF upload for lesson resource (demo-friendly: silently ignore failures)
    if (!empty($_FILES['lesson_pdf']['name'])) {
      $ext = strtolower(pathinfo($_FILES['lesson_pdf']['name'], PATHINFO_EXTENSION));
      if ($ext === 'pdf') {
        $safe = preg_replace('/[^a-z0-9_\-\.]/i','_', $_FILES['lesson_pdf']['name']);
        $target = $uploadDir . '/' . time() . '_' . $safe;
        if (move_uploaded_file($_FILES['lesson_pdf']['tmp_name'], $target)) {
          $lesson['pdf_path'] = $target;
        }
      }
    }
    $lessons = load_json($lessonFile);
    $lessons[] = $lesson;
    save_json($lessonFile, $lessons);
    $_SESSION['flash'] = 'Lesson created: '.h($lesson['title']);
    header('Location: ?page=lessons');
    exit;
  }

  // ---- Enroll Student ----
if (isset($_POST['enroll_student']) && $_SESSION['user']['role'] === 'teacher') {
    $student_number  = trim($_POST['student_number']);
    $first_name      = trim($_POST['first_name']);
    $last_name       = trim($_POST['last_name']);
    $middle_initial  = trim($_POST['middle_initial']);
    $year_course     = trim($_POST['year_course']);
    $uphsl_email     = trim($_POST['uphsl_email']);
    $username        = trim($_POST['username']);
    $password        = trim($_POST['password']);

    // Handle profile picture upload
    $profile_picture = null;
    if (!empty($_FILES['profile_picture']['name'])) {
        $upload_dir = "uploads/";
        if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
        $file_name = time() . "_" . basename($_FILES['profile_picture']['name']);
        $target_file = $upload_dir . $file_name;

        if (move_uploaded_file($_FILES['profile_picture']['tmp_name'], $target_file)) {
            $profile_picture = $target_file;
        }
    }

    // Insert into users table (role = student)
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (username, password, role, created_at) VALUES (?, ?, 'student', NOW())");
    $stmt->bind_param("ss", $username, $hashed_password);
    $stmt->execute();
    $user_id = $stmt->insert_id;
    $stmt->close();

    // Insert into students table
    $stmt = $conn->prepare("INSERT INTO students 
        (student_number, first_name, last_name, middle_initial, year_course, uphsl_email, profile_picture, user_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssssi", $student_number, $first_name, $last_name, $middle_initial, $year_course, $uphsl_email, $profile_picture, $user_id);
    $stmt->execute();
    $stmt->close();

    $_SESSION['flash'] = "Student $first_name $last_name has been successfully enrolled.";
    header("Location: ?page=student");
    exit;
}
  // Run KNN classification
  if (isset($_POST['run_knn'])) {
    $k = max(1, min(15, (int)($_POST['k'] ?? 5)));
    $path = $_POST['dataset_path'] ?: ($_SESSION['last_dataset'] ?? '');
    $_SESSION['knn_result'] = run_knn_on_csv($path, $k);
    $_SESSION['knn_path'] = $path;
    $_SESSION['knn_k'] = $k;
    header("Location: ?page=knn");
    exit;
  }
}

// ---- Gate pages behind login (except login page) ----
if (!isset($_SESSION['user']) && $page !== 'login') {
  header('Location: ?page=login');
  exit;
}

// ---- Role-based route guard ----
if (isset($_SESSION['user'])) {
  $role = $_SESSION['user']['role'] ?? 'teacher';
  if ($role === 'student' && $page !== 'login') {
    header('Location: student_portal.php');
    exit;
  }
}

// ---- KNN logic (simple Euclidean, majority vote) ----
function euclidean_distance($a, $b, $keys){
  $sum = 0.0;
  foreach ($keys as $key) {
    $x = (float)($a[$key] ?? 0);
    $y = (float)($b[$key] ?? 0);
    $sum += ($x - $y) * ($x - $y);
  }
  return sqrt($sum);
}

function knn_classify($row, $train, $k, $featureKeys, $labelKey){
  $dists = [];
  foreach ($train as $i => $t) {
    if (!isset($t[$labelKey])) continue;
    $dists[] = ['i'=>$i, 'd'=>euclidean_distance($row, $t, $featureKeys), 'label'=>$t[$labelKey]];
  }
  usort($dists, fn($x,$y)=> $x['d'] <=> $y['d']);
  $votes = [];
  for ($i=0; $i < min($k, count($dists)); $i++) {
    $lab = (string)$dists[$i]['label'];
    $votes[$lab] = ($votes[$lab] ?? 0) + 1;
  }
  arsort($votes);
  return key($votes);
}

function run_knn_on_csv($path, $k=5){
  if (!$path || !is_file($path)) {
    return ['error' => 'Dataset CSV not found. Upload a dataset on Uploads tab.'];
  }
  // Expected headers (extend as needed)
  // student_id,attendance,quiz,activity,assignment,lab,exam,label
  $fh = fopen($path, 'r');
  $hdr = fgetcsv($fh);
  if (!$hdr) return ['error' => 'Empty CSV.'];
  $rows = [];
  while (($r = fgetcsv($fh)) !== false) {
    $rows[] = array_combine($hdr, $r);
  }
  fclose($fh);

  // Split 70/30 for blueprint demo
  $n = count($rows);
  if ($n < 5) return ['error' => 'Need at least 5 rows.'];
  $split = (int)floor($n * 0.7);
  $train = array_slice($rows, 0, $split);
  $test  = array_slice($rows, $split);

  $featureKeys = ['attendance','quiz','activity','assignment','lab','exam'];
  $labelKey    = 'label'; // High|Average|At-Risk

  $preds = [];
  $correct = 0;
  foreach ($test as $row) {
    $pred = knn_classify($row, $train, $k, $featureKeys, $labelKey);
    $rowPred = [
      'student_id' => $row['student_id'] ?? '',
      'true_label' => $row[$labelKey] ?? '',
      'pred_label' => $pred
    ];
    if (($rowPred['true_label'] !== '') && $rowPred['true_label'] === $pred) $correct++;
    $preds[] = $rowPred;
  }
  $acc = count($test) ? round(($correct / count($test)) * 100, 2) : 0;

  return [
    'meta' => ['k'=>$k, 'train'=>count($train), 'test'=>count($test), 'accuracy'=>$acc],
    'predictions' => $preds
  ];
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>LMS Blueprint — Student Performance Evaluation (KNN)</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="style.css">
</head>
<body>
<?php if ($page === 'login'): ?>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-brand"><span class="dot"></span> <span>LMS • Teacher</span></div>
      <div class="login-sub">Sign in to access your classroom tools.</div>
      <?php if (!empty($_SESSION['flash'])): ?>
        <div class="flash"><?=h($_SESSION['flash']); unset($_SESSION['flash']);?></div>
      <?php endif; ?>
      <form method="post" class="grid" style="gap:12px;">
        <input type="hidden" name="do_login" value="1">
        <div>
          <label>Username</label>
          <input class="input" name="username" placeholder="e.g., t.smith" required>
        </div>
        <div>
          <label>Password</label>
          <input class="input" type="password" name="password" placeholder="Your password" required>
        </div>
        <div>
          <label>Login as</label>
          <select class="input" name="role">
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
        <button class="btn accent" type="submit">Sign In</button>
      </form>
      <p class="muted" style="margin-top:10px">Demo: any non-empty credentials work.</p>
    </div>
  </div>
<?php else: ?>
<div class="layout">
  <aside class="sidebar">
    <div class="brand"><span class="dot"></span> <span>LMS • Teacher</span></div>
    <?php if (($role ?? ($_SESSION['user']['role'] ?? 'teacher')) === 'teacher'): ?>
    <div class="section">Classroom</div>
    <nav class="nav sub">
      <a class="<?= $page==='dashboard'?'active':'' ?>" href="?page=dashboard">
        <span aria-hidden="true" style="display:inline-flex">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" fill="currentColor"/>
          </svg>
        </span>
        Dashboard
      </a>
      <a class="<?= $page==='uploads'?'active':'' ?>" href="?page=uploads">
        <span aria-hidden="true" style="display:inline-flex">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3l4 4h-3v6h-2V7H8l4-4Zm-7 9h2v8h14v-8h2v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9Z" fill="currentColor"/>
          </svg>
        </span>
        Resources &amp; Uploads
      </a>
    </nav>
    <div class="section">Assessments</div>
    <nav class="nav sub">
      <a class="<?= $page==='quiz'?'active':'' ?>" href="?page=quiz">
        <span aria-hidden="true" style="display:inline-flex">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4h12a2 2 0 0 1 2 2v10l-4-3H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="currentColor"/>
          </svg>
        </span>
        Quizzes
      </a>
      <a class="<?= $page==='activity'?'active':'' ?>" href="?page=activity">
        <span aria-hidden="true" style="display:inline-flex">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z" fill="currentColor"/>
          </svg>
        </span>
        Activities
      </a>
      <a class="<?= $page==='exams'?'active':'' ?>" href="?page=exams">
        <span aria-hidden="true" style="display:inline-flex">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3h8l1 2h3v2H4V5h3l1-2Zm-4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Zm4 3v2h8v-2H8Z" fill="currentColor"/>
          </svg>
        </span>
        Exams
      </a>
    </nav>
    <div class="section">Curriculum</div>
    <nav class="nav sub">
      <a class="<?= $page==='lessons'?'active':'' ?>" href="?page=lessons">
        <span aria-hidden="true" style="display:inline-flex">
          <?= render_icon('lessons', 16) ?>
        </span>
        Lessons
      </a>
    </nav>
    <div class="section">Students</div>
    <nav class="nav sub">
      <a class="<?= $page==='student'?'active':'' ?>" href="?page=student">
        <span aria-hidden="true" style="display:inline-flex">
          <?= render_icon('dashboard', 16) ?>
        </span>
        Student Enrollment
      </a>
    </nav>
    <div class="section">Analytics</div>
    <nav class="nav sub">
      <a class="<?= $page==='knn'?'active':'' ?>" href="?page=knn">
        <span aria-hidden="true" style="display:inline-flex">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19V5h2v14H4Zm4-6V5h2v8H8Zm4 4V5h2v12h-2Zm4-8V5h2v4h-2Z" fill="currentColor"/>
          </svg>
        </span>
        KNN Classifier
      </a>
    </nav>
    <?php else: ?>
      <div class="section">Student</div>
      <nav class="nav sub">
        <a class="<?= $page==='student'?'active':'' ?>" href="?page=student">
          <span aria-hidden="true" style="display:inline-flex">
            <?= render_icon('dashboard', 16) ?>
          </span>
          Student Enrollment
        </a>
      </nav>
    <?php endif; ?>
    <div class="footer">BackEnd Blueprint 20% • KNN</div>
  </aside>

  <main>
    <div class="topbar">
      <div class="pagetitle">
        <span aria-hidden="true" style="display:inline-flex;color:var(--accent)">
          <?= render_icon($page, 18) ?>
        </span>
        <strong><?=h(ucfirst($page))?></strong>
      </div>
      <div class="top-actions">
        <span class="user"><?=h($_SESSION['user']['name'])?> (<?=h($_SESSION['user']['role'])?>)</span>
        <a class="btn light" href="?action=logout">Logout</a>
      </div>
    </div>
    <div class="content">
      <?php if (!empty($_SESSION['flash'])): ?>
        <div class="flash"><?=h($_SESSION['flash']); unset($_SESSION['flash']);?></div>
      <?php endif; ?>

      <?php if ($page === 'dashboard'): ?>
        <div class="grid cards">
          <div class="card">
            <h3 class="title">Quick Start</h3>
            <p class="muted">Upload a dataset CSV, then test the KNN classifier.</p>
            <div class="actions">
              <a class="btn accent" href="?page=uploads">Go to Uploads</a>
            </div>
          </div>
          <div class="card">
            <h3 class="title">Latest Upload</h3>
            <p class="muted"><?= isset($_SESSION['last_dataset']) ? basename($_SESSION['last_dataset']) : 'No dataset yet'; ?></p>
            <div class="actions">
              <a class="btn" href="?page=knn">Open KNN</a>
            </div>
          </div>
          <div class="card">
            <h3 class="title">Create Content</h3>
            <div class="actions">
              <a class="btn" href="?page=quiz">New Quiz</a>
              <a class="btn" href="?page=exams">New Exam</a>
            </div>
          </div>
        </div>

      <?php elseif ($page === 'uploads'): ?>
        <div class="card">
          <h3 class="title">Upload Files</h3>
          <form method="post" enctype="multipart/form-data" class="grid" style="gap:12px;">
            <input type="hidden" name="upload_type" value="dataset">
            <div class="row">
              <div>
                <label>Dataset (CSV)</label>
                <input class="input" type="file" name="file" accept=".csv" required>
              </div>
              <div>
                <label>&nbsp;</label>
                <button class="btn accent" type="submit">Upload Dataset</button>
              </div>
            </div>
            <p class="muted">CSV schema (demo): <code>student_id,attendance,quiz,activity,assignment,lab,exam,label</code> — label: High | Average | At-Risk</p>
          </form>
        </div>

        <div class="grid cards">
          <?php foreach (['quiz','activity','exam'] as $t): ?>
            <div class="card">
              <h4 class="title">Upload <?=ucfirst($t)?> File</h4>
              <form method="post" enctype="multipart/form-data" class="row">
                <input type="hidden" name="upload_type" value="<?=$t?>">
                <input class="input" type="file" name="file" required>
                <button class="btn" type="submit">Upload <?=ucfirst($t)?></button>
              </form>
            </div>
          <?php endforeach; ?>
        </div>

      <?php elseif ($page === 'activity'): ?>
  <?php $title = "Activity"; ?>
  <div class="card">
    <h3 class="title">Create <?=$title?></h3>
    <form method="post" enctype="multipart/form-data" class="grid" style="gap:12px;">
      <input type="hidden" name="create_item" value="1">

      <div class="row">
        <div>
          <label>Title</label>
          <input class="input" name="title" required>
        </div>
        <div>
          <label>Max Grade</label>
          <input class="input" type="number" name="max_score" value="100" min="1">
        </div>
      </div>

      <div>
        <label>Description</label>
        <textarea class="input" name="desc" rows="3" placeholder="Short notes for students..."></textarea>
      </div>

      <!-- Availability -->
      <div class="section">Availability</div>
      <div class="row">
        <div>
          <label>Allow submissions from</label>
          <input class="input" type="date" name="allow_from">
        </div>
        <div>
          <label>Due date</label>
          <input class="input" type="date" name="due_date">
        </div>
      </div>
      <div class="row">
        <div>
          <label>Cut-off date</label>
          <input class="input" type="date" name="cut_off_date">
        </div>
        <div>
          <label>Remind me to grade by</label>
          <input class="input" type="date" name="remind_date">
        </div>
      </div>

      <!-- Submission types -->
      <div class="section">Submission Types</div>
      <div>
        <label><input type="checkbox" name="submission_types[]" value="online_text"> Online Text</label><br>
        <label><input type="checkbox" name="submission_types[]" value="file_upload"> File Upload</label>
      </div>

      <!-- File upload -->
      <div>
        <label>Upload File</label>
        <input class="input" type="file" name="file_upload">
      </div>

      <button class="btn accent" type="submit">Upload <?=$title?></button>
    </form>
  </div>

  <div class="card">
    <h3 class="title"><?=$title?> List</h3>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Max</th>
          <th>Availability</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
      <?php 
      $stmt = $pdo->query("SELECT * FROM activities ORDER BY created_at DESC");
      $items = $stmt->fetchAll();
      if (!$items) {
        echo "<tr><td colspan='4' class='muted'>No items yet.</td></tr>";
      }
      foreach ($items as $it) {
          echo "<tr>
            <td>".h($it['title'])."</td>
            <td>".h($it['max_score'])."</td>
            <td>From ".h($it['allow_from'])." to ".h($it['cut_off_date'])."</td>
            <td>".h(date('M d, Y', strtotime($it['created_at'])))."</td>
      </tr>";
      }
      ?>
      </tbody>
    </table>
  </div>

<?php elseif (in_array($page, ['quiz','exams'])): ?>
  <?php $title = ucfirst(rtrim($page,'s')); ?>
  <div class="card">
    <h3 class="title">Create <?=$title?></h3>
    <form method="post" class="grid" style="gap:12px;">
      <input type="hidden" name="create_item" value="1">

      <div class="row">
        <div>
          <label>Title</label>
          <input class="input" name="title" required>
        </div>
        <div>
          <label>Max Score</label>
          <input class="input" type="number" name="max_score" value="100" min="1">
        </div>
      </div>

      <div>
        <label>Description</label>
        <textarea class="input" name="desc" rows="3" placeholder="Short notes for students..."></textarea>
      </div>

      <div>
        <label>Questions (one per line)</label>
        <textarea class="input" name="questions[]" rows="6" placeholder="Q1&#10;Q2&#10;Q3"></textarea>
      </div>

      <button class="btn accent" type="submit">Save <?=$title?></button>
    </form>
  </div>

  <div class="card">
    <h3 class="title"><?=$title?> List</h3>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Max</th>
          <th>Questions</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
      <?php 
        $file = ($page==='quiz') ? $quizFile : $examFile;
        $items = load_json($file);
        if (!$items) { 
          echo "<tr><td colspan='4' class='muted'>No items yet.</td></tr>"; 
        }
        foreach ($items as $it){
          echo "<tr>
            <td>".h($it['title'])."</td>
            <td>".h($it['max_score'])."</td>
            <td>".count($it['questions'])."</td>
            <td>".h(date('M d, Y', strtotime($it['created_at'])))."</td>
          </tr>";
        }
      ?>
      </tbody>
    </table>
  </div>

      <?php elseif ($page === 'lessons'): ?>
        <div class="card">
          <h3 class="title">Create Lesson</h3>
          <form method="post" enctype="multipart/form-data" class="grid" style="gap:12px;">
            <input type="hidden" name="create_lesson" value="1">
            <div class="row">
              <div>
                <label>Title</label>
                <input class="input" name="title" required>
              </div>
              <div>
                <label>Summary</label>
                <input class="input" name="summary" placeholder="Short lesson overview">
              </div>
            </div>
            <div>
              <label>Content</label>
              <textarea class="input" name="content" rows="6" placeholder="Main lesson content..."></textarea>
            </div>
            <div>
              <label>Attach PDF (optional)</label>
              <input class="input" type="file" name="lesson_pdf" accept="application/pdf,.pdf">
            </div>
            <div class="actions">
              <button class="btn accent" type="submit">Save Lesson</button>
            </div>
          </form>
        </div>

      <?php elseif ($page === 'student'): ?>
  <div class="grid" style="grid-template-columns: 1fr; gap: 20px; max-width: 1200px; margin: 0 auto;">
    <h2 class="title" style="text-align:center; font-size: 28px; margin-bottom: 20px;">Enroll Student</h2>
    
    <form method="post" enctype="multipart/form-data" class="grid" style="gap: 20px;">
      <input type="hidden" name="enroll_student" value="1">

      <!-- Student Number -->
      <div class="card" style="padding: 20px;">
        <label>Student Number</label>
        <input class="input" name="student_number" 
               pattern="m[0-9]{2}-[0-9]{4}-[0-9]{3}" 
               placeholder="m22-0443-812" required>
      </div>

      <!-- Full Name -->
      <div class="card grid" style="padding: 20px; gap: 12px;">
        <label>Full Name</label>
        <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 12px;">
          <input class="input" name="first_name" placeholder="First Name" required>
          <input class="input" name="last_name" placeholder="Last Name" required>
          <input class="input" name="middle_initial" maxlength="1" placeholder="M" required>
        </div>
      </div>

      <!-- Year & Course -->
      <div class="card" style="padding: 20px;">
        <label>Year & Course</label>
        <input class="input" name="year_course" placeholder="e.g., 2nd Year BSIT" required>
      </div>

      <!-- UPHSL Email -->
      <div class="card" style="padding: 20px;">
        <label>UPHSL Gmail Account</label>
        <input class="input" type="email" name="uphsl_email" 
               pattern="[a-z0-9._%+-]+@manila\.uphsl\.edu\.ph$" 
               placeholder="m22-0443-812@manila.uphsl.edu.ph" required>
      </div>

      <!-- Profile Picture -->
      <div class="card" style="padding: 20px;">
        <label>Profile Picture</label>
        <input class="input" type="file" name="profile_picture" accept="image/*" required>
      </div>

      <!-- Username & Password -->
      <div class="card grid" style="padding: 20px; gap: 12px;">
        <label>Login Credentials</label>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <input class="input" name="username" placeholder="Username" required>
          <input class="input" type="password" name="password" placeholder="Password" required>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="card" style="padding: 20px; text-align:center;">
        <button class="btn accent" type="submit" style="width: 100%; padding: 12px; font-size: 18px;">
          Enroll Student
        </button>
      </div>
    </form>
  </div>

      <?php elseif ($page === 'knn'): 
        $res = $_SESSION['knn_result'] ?? null;
        $path = $_SESSION['knn_path'] ?? '';
        $kval = $_SESSION['knn_k'] ?? 5;
      ?>
        <div class="card">
          <h3 class="title">KNN Classifier (Demo)</h3>
          <form method="post" class="row">
            <div>
              <label>Dataset Path</label>
              <input class="input" name="dataset_path" value="<?=h($path)?>" placeholder="/absolute/path/to/dataset.csv">
            </div>
            <div>
              <label>K (neighbors)</label>
              <input class="input" type="number" name="k" min="1" max="15" value="<?=h($kval)?>">
            </div>
            <div>
              <label>&nbsp;</label>
              <button class="btn accent" name="run_knn" value="1">Run KNN</button>
            </div>
          </form>
          <p class="muted">Uses features: attendance, quiz, activity, assignment, lab, exam • Label: High / Average / At-Risk</p>
        </div>

        <div class="card">
          <h4 class="title">Results</h4>
          <?php if (!$res): ?>
            <p class="muted">No results yet. Upload a dataset (Uploads tab) or set a CSV path, then Run KNN.</p>
          <?php elseif (isset($res['error'])): ?>
            <div class="flash" style="background:#3b1e20;border-color:#5b1f24;color:#fecaca"><?=h($res['error'])?></div>
          <?php else: ?>
            <div style="margin-bottom:10px;">
              <span class="tag">k = <?=h($res['meta']['k'])?></span>
              <span class="tag">train = <?=h($res['meta']['train'])?></span>
              <span class="tag">test = <?=h($res['meta']['test'])?></span>
              <span class="tag good">accuracy = <?=h($res['meta']['accuracy'])?>%</span>
            </div>
            <table>
              <thead><tr><th>Student</th><th>True</th><th>Predicted</th></tr></thead>
              <tbody>
              <?php foreach ($res['predictions'] as $p): 
                $cls = strtolower(str_replace(' ','',$p['pred_label']));
                $badge = 'tag';
                if ($p['pred_label']==='High') $badge .= ' good';
                elseif ($p['pred_label']==='Average') $badge .= ' avg';
                else $badge .= ' risk';
              ?>
                <tr>
                  <td><?=h($p['student_id'])?></td>
                  <td><?=h($p['true_label'])?></td>
                  <td><span class="<?=$badge?>"><?=h($p['pred_label'])?></span></td>
                </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
          <?php endif; ?>
        </div>

      <?php else: ?>
        <div class="card"><div class="muted">Page not found.</div></div>
      <?php endif; ?>
    </div>
  </main>
</div>
<?php endif; ?>
</body>
</html>
