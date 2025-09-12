<?php
require_once "db.php";
session_start();

// Minimal helpers (duplicated for isolation)
function h($s){ return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8'); }
function save_json($path, $data){ file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT)); }
function load_json($path){ return is_file($path) ? json_decode(file_get_contents($path), true) : []; }

// Paths (reuse same store/uploads)
$baseDir = __DIR__;
$uploadDir = $baseDir . '/uploads';
if (!is_dir($uploadDir)) { @mkdir($uploadDir, 0777, true); }
$store = $baseDir . '/store';
if (!is_dir($store)) { @mkdir($store, 0777, true); }
$quizFile = $store.'/quiz.json';
$actFile  = $store.'/activity.json';
$examFile = $store.'/exams.json';
$lessonFile = $store.'/lessons.json';
$quizSubFile = $store.'/submissions_quiz.json';
$examSubFile = $store.'/submissions_exam.json';
$activitySubFile = $store.'/submissions_activity.json';

// Tabs and current student name
$tab = $_GET['tab'] ?? 'quizzes';
$studentName = $_SESSION['user']['name'] ?? 'Student';

// Helpers to compute status for items per student (due = created_at + 7 days)
function is_submitted($subs, $student, $key, $id){
  foreach ($subs as $s){ if (($s[$key] ?? '') === $id && strcasecmp($s['student'] ?? '', $student) === 0) return true; }
  return false;
}
function compute_due_status($createdAt){
  $dueTs = strtotime($createdAt.' +7 days');
  return time() > $dueTs; // true if past due
}

// Role gate: only students
if (!isset($_SESSION['user'])) { header('Location: index.php?page=login'); exit; }
if (($_SESSION['user']['role'] ?? 'student') !== 'student') { header('Location: index.php?page=dashboard'); exit; }

// Handle submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['student_submit'])){
  $kind = $_POST['kind'] ?? '';
  $student = trim($_POST['student_name'] ?? 'Student');
  $payload = [ 'id'=>uniqid(), 'student'=>$student, 'created_at'=>date('c') ];
  if ($kind === 'quiz'){
    $payload['quiz_id'] = $_POST['quiz_id'] ?? '';
    $payload['answers'] = array_map('trim', $_POST['answers'] ?? []);
    $data = load_json($quizSubFile); $data[] = $payload; save_json($quizSubFile, $data);
    $_SESSION['flash'] = 'Quiz submitted.';
  }
  if ($kind === 'exam'){
    $payload['exam_id'] = $_POST['exam_id'] ?? '';
    $payload['answers'] = array_map('trim', $_POST['answers'] ?? []);
    $data = load_json($examSubFile); $data[] = $payload; save_json($examSubFile, $data);
    $_SESSION['flash'] = 'Exam submitted.';
  }
  if ($kind === 'activity'){
    $payload['activity_id'] = $_POST['activity_id'] ?? '';
    $payload['file_path'] = '';
    if (!empty($_FILES['activity_file']['name'])){
      $safe = preg_replace('/[^a-z0-9_\-\.]/i','_', $_FILES['activity_file']['name']);
      $target = $uploadDir.'/'.time().'_'.$safe;
      if (@move_uploaded_file($_FILES['activity_file']['tmp_name'], $target)){
        $payload['file_path'] = $target;
      }
    }
    $data = load_json($activitySubFile); $data[] = $payload; save_json($activitySubFile, $data);
    $_SESSION['flash'] = 'Activity submitted.';
  }
  header('Location: student_portal.php'); exit;
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Student Portal</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="style2.css">
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand"><span class="dot"></span> <span>LMS • Student</span></div>
      <div class="section">Browse</div>
      <nav class="nav sub">

          <a class="<?= $tab==='dashboard'?'active':'' ?>" href="?tab=dashboard">
  <span aria-hidden="true" style="display:inline-flex">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2"/></svg>
  </span>
  Dashboard
</a>

        <a class="<?= $tab==='quizzes'?'active':'' ?>" href="?tab=quizzes">
          <span aria-hidden="true" style="display:inline-flex"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h12a2 2 0 0 1 2 2v10l-4-3H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="currentColor"/></svg></span>
          Quizzes
        </a>
        <a class="<?= $tab==='activities'?'active':'' ?>" href="?tab=activities">
          <span aria-hidden="true" style="display:inline-flex"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z" fill="currentColor"/></svg></span>
          Activities
        </a>
        <a class="<?= $tab==='exams'?'active':'' ?>" href="?tab=exams">
          <span aria-hidden="true" style="display:inline-flex"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3h8l1 2h3v2H4V5h3l1-2Zm-4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Zm4 3v2h8v-2H8Z" fill="currentColor"/></svg></span>
          Exams
        </a>
        <a class="<?= $tab==='lessons'?'active':'' ?>" href="?tab=lessons">
          <span aria-hidden="true" style="display:inline-flex"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm9 0v3h3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" stroke-width="2"/></svg></span>
          Lessons
        </a>
      </nav>
      <div class="footer" style="opacity:.6;margin-top:18px;font-size:12px">• Student Dashboard</div>
      <div style="margin-top:10px"><a class="btn" href="index.php?action=logout">Logout</a></div>
    </aside>
    <main>
      <div class="topbar">
        <div class="pagetitle" style="display:flex;align-items:center;gap:10px">
          <span aria-hidden="true" style="display:inline-flex;color:var(--accent)">
            <?php
              $icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>';
              if ($tab==='quizzes') $icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h12a2 2 0 0 1 2 2v10l-4-3H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="currentColor"/></svg>';
              if ($tab==='activities') $icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z" fill="currentColor"/></svg>';
              if ($tab==='exams') $icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3h8l1 2h3v2H4V5h3l1-2Zm-4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Zm4 3v2h8v-2H8Z" fill="currentColor"/></svg>';
              if ($tab==='lessons') $icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm9 0v3h3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" stroke-width="2"/></svg>';
              echo $icon;
            ?>
          </span>
          <strong><?= ucfirst($tab) ?></strong>
        </div>
        <div>
          <span class="muted"><?=h($_SESSION['user']['name'] ?? 'Student')?></span>
        </div>
      </div>
      <div class="content">
                <?php if ($tab === 'dashboard'): ?>
  <div class="grid">
    <!-- Welcome Banner -->
    <div class="card" style="grid-column:1/-1;background:linear-gradient(135deg,#24407d,#3257a7);color:#fff">
      <h2>Welcome back, <?=h($studentName)?>!</h2>
      <p><?=date("l, F j, Y")?></p>
    </div>

    <!-- Quick Stats -->
    <div class="card">
      <h3>Total Quizzes</h3>
      <p><strong><?= count(load_json($quizFile)) ?></strong></p>
    </div>
    <div class="card">
      <h3>Total Activities</h3>
      <p><strong><?= count(load_json($actFile)) ?></strong></p>
    </div>
    <div class="card">
      <h3>Total Exams</h3>
      <p><strong><?= count(load_json($examFile)) ?></strong></p>
    </div>

    <!-- Enrolled Courses -->
    <div class="card" style="grid-column:1/-1">
      <h3>Enrolled Lessons</h3>
      <ul>
        <?php $less = load_json($lessonFile); if(!$less){ echo "<li class='muted'>No lessons yet.</li>"; }
          foreach($less as $ls){ echo "<li>".h($ls['title'])."</li>"; }
        ?>
      </ul>
    </div>

    <!-- Upcoming Deadlines -->
    <div class="card" style="grid-column:span 2">
      <h3>Upcoming Deadlines</h3>
      <ul>
        <?php
          $acts = $pdo->query("SELECT * FROM activities ORDER BY created_at DESC LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
          if (!$acts) echo "<li class='muted'>No activities.</li>";
          foreach($acts as $a){
            $dueDate = date("F j, Y", strtotime($a['created_at']." +7 days"));
            echo "<li>".h($a['title'])." – due <strong>$dueDate</strong></li>";
          }
        ?>
      </ul>
    </div>

    <!-- Notices -->
    <div class="card">
      <h3>Notices</h3>
      <p class="muted">No announcements yet.</p>
    </div>
  </div>
<?php endif; ?>

    <?php if (!empty($_SESSION['flash'])): ?>
      <div class="flash"><?=h($_SESSION['flash']); unset($_SESSION['flash']);?></div>
    <?php endif; ?>
    <?php if ($tab === 'lessons'): ?>
      <div class="grid">
        <div class="card">
          <h3 class="title">Lessons</h3>
          <table>
            <thead><tr><th>Title</th><th>Summary</th><th>PDF</th></tr></thead>
            <tbody>
            <?php $less = load_json($lessonFile); if(!$less){ echo "<tr><td colspan='3' class='muted'>No lessons yet.</td></tr>"; }
              foreach(array_reverse($less) as $ls){
                $pdfCell = !empty($ls['pdf_path']) ? '<a class=\'btn\' href=\'uploads/'.h(basename($ls['pdf_path']))."\' target=\'_blank\'>View</a>" : '<span class=\'muted\'>None</span>';
                echo "<tr><td>".h($ls['title'])."</td><td>".h($ls['summary'])."</td><td>".$pdfCell."</td></tr>";
              }
            ?>
            </tbody>
          </table>
        </div>
      </div>
      
    <?php elseif ($tab === 'quizzes'): ?>
    <div class="grid">
      <div class="card">
        <h3 class="title">Take a Quiz</h3>
        <?php $quizzes = load_json($quizFile); if (!$quizzes): ?>
          <p class="muted">No quizzes available.</p>
        <?php else: $q = $quizzes[array_key_first($quizzes)]; ?>
          <form method="post" class="grid" style="gap:12px;">
            <input type="hidden" name="student_submit" value="1">
            <input type="hidden" name="kind" value="quiz">
            <input type="hidden" name="quiz_id" value="<?=h($q['id'])?>">
            <div>
              <label>Your Name</label>
              <input class="input" name="student_name" required>
            </div>
            <div>
              <label>Answers (comma-separated)</label>
              <input class="input" name="answers[]" placeholder="A,B,C,D">
            </div>
            <div class="actions"><button class="btn accent" type="submit">Submit Quiz</button></div>
          </form>
        <?php endif; ?>
      </div>

      <div class="card">
        <h3 class="title">Submit Activity</h3>
        <?php $activities = load_json($actFile); if (!$activities): ?>
          <p class="muted">No activities available.</p>
        <?php else: $a = $activities[array_key_first($activities)]; ?>
          <form method="post" enctype="multipart/form-data" class="grid" style="gap:12px;">
            <input type="hidden" name="student_submit" value="1">
            <input type="hidden" name="kind" value="activity">
            <input type="hidden" name="activity_id" value="<?=h($a['id'])?>">
            <div>
              <label>Your Name</label>
              <input class="input" name="student_name" required>
            </div>
            <div>
              <label>Upload File</label>
              <input class="input" type="file" name="activity_file">
            </div>
            <div class="actions"><button class="btn accent" type="submit">Submit Activity</button></div>
          </form>
        <?php endif; ?>
      </div>

      <div class="card">
        <h3 class="title">Take Exam</h3>
        <?php $exams = load_json($examFile); if (!$exams): ?>
          <p class="muted">No exams available.</p>
        <?php else: $e = $exams[array_key_first($exams)]; ?>
          <form method="post" class="grid" style="gap:12px;">
            <input type="hidden" name="student_submit" value="1">
            <input type="hidden" name="kind" value="exam">
            <input type="hidden" name="exam_id" value="<?=h($e['id'])?>">
            <div>
              <label>Your Name</label>
              <input class="input" name="student_name" required>
            </div>
            <div>
              <label>Answers (comma-separated)</label>
              <input class="input" name="answers[]" placeholder="A,B,C,D">
            </div>
            <div class="actions"><button class="btn accent" type="submit">Submit Exam</button></div>
          </form>
        <?php endif; ?>
      </div>

    </div>
    <?php elseif ($tab === 'activities'): ?>
<div class="grid">
  <?php 
    $stmt = $pdo->query("SELECT * FROM activities ORDER BY created_at DESC");
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$activities): ?>
      <p class="muted">No activities available.</p>
    <?php else: 
      foreach ($activities as $a):
        // Check submission
        $stmtSub = $pdo->prepare("SELECT * FROM submitted_activities WHERE activity_id=? AND student_id=? LIMIT 1");
        $stmtSub->execute([$a['id'], $_SESSION['user']['id']]);
        $submission = $stmtSub->fetch(PDO::FETCH_ASSOC);

        $submissionStatus = $submission ? "Submitted for grading" : "No submission";
        $gradingStatus = $submission ? ucfirst($submission['grading_status']) : "Not graded";

        $dueDate = date("F j, Y", strtotime($a['created_at']." +7 days"));
  ?>
    <div class="card activity-card" onclick="toggleActivityDetails('act-<?=$a['id']?>')">
      <h3><?=h($a['title'])?></h3>
      <p><strong>File:</strong> 
  <?php if (!empty($a['file_path'])): 
        $fileName = basename($a['file_path']); ?>
    <a href="<?=h($a['file_path'])?>" target="_blank"><?=h($fileName)?></a>
  <?php else: ?>
    <span class="muted">None</span>
  <?php endif; ?>
</p>

      <p><strong>Submission Status:</strong> <?=$submissionStatus?></p>
      <p><strong>Grading Status:</strong> <?=$gradingStatus?></p>
      <p><strong>Due Date:</strong> <?=$dueDate?></p>
    </div>

    <!-- Hidden details -->
    <div id="act-<?=$a['id']?>" class="activity-details hidden">
      <h4><?=h($a['title'])?> – Details</h4>
      <p><?=nl2br(h($a['description'] ?? 'No description'))?></p>
      <form method="post" enctype="multipart/form-data" class="grid" style="gap:12px;">
        <input type="hidden" name="student_submit" value="1">
        <input type="hidden" name="kind" value="activity">
        <input type="hidden" name="activity_id" value="<?=h($a['id'])?>">
        <div>
          <label>Online Text</label>
          <textarea class="input" name="submission_text" placeholder="Write your answer here..."></textarea>
        </div>
        <div>
          <label>Upload File</label>
          <input class="input" type="file" name="activity_file">
        </div>
        <div class="actions"><button class="btn accent" type="submit">Upload Activity</button></div>
      </form>
    </div>
  <?php endforeach; endif; ?>
</div>
<?php endif; ?>

<script>
function toggleActivityDetails(id) {
  document.querySelectorAll('.activity-details').forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
</script>
</body>
</html>


