// Integrated Community hub. Loaded after app.js so its router can replace the
// earlier feed-only community view while reusing the app's API and UI helpers.
(function () {
  const tabs = [
    ["feed", "Discussions", "◉"],
    ["members", "Members", "◎"],
    ["groups", "Groups", "◇"],
    ["events", "Events", "▦"],
    ["news", "News", "✳"],
    ["messages", "Messages", "✉"],
  ];

  const linkTabs = (active) =>
    '<nav class="community-hub-tabs" aria-label="Community sections">' +
    tabs
      .map(
        ([key, label, icon]) =>
          '<a class="community-hub-tab ' +
          (active === key ? "active" : "") +
          '" href="#community?tab=' +
          key +
          '"><span aria-hidden="true">' +
          icon +
          "</span>" +
          label +
          "</a>",
      )
      .join("") +
      "</nav>";

  const hero =
    '<section class="community-hub-hero"><div><span class="eyebrow">ALUMNICONNECT · YOUR NETWORK</span><h1>Community</h1><p>Share ideas, meet people with common interests, and stay close to the events and opportunities across your alumni network.</p></div><div class="community-hub-mark" aria-hidden="true">AC</div></section>';

  const frame = (tab, body) => {
    content.innerHTML = hero + linkTabs(tab) + body;
  };

  const safeImage = (url, alt = "") =>
    /^https:\/\//i.test(url || "")
      ? '<img src="' + esc(url) + '" alt="' + esc(alt) + '" loading="lazy">'
      : "";

  async function communityHub(params = new URLSearchParams()) {
    if (!me) return authPrompt();
    const tab = params.get("tab") || "feed";
    const groupId = Number(params.get("group_id")) || 0;
    const groups = (await api("/community/groups").catch(() => ({ items: [] })))
      .items || [];
    const refresh = () =>
      communityHub(new URLSearchParams(location.hash.split("?")[1] || ""));

    if (tab === "feed") {
      const groupQuery = groupId ? "?group_id=" + groupId : "";
      const posts = (await api("/community/posts" + groupQuery)).items || [];
      const joined = groups.filter((group) => group.joined_by_me);
      const currentGroup = groups.find((group) => group.id === groupId);
      const composer =
        '<section class="community-composer panel"><div class="community-composer-heading"><div><span class="eyebrow">START A DISCUSSION</span><h2>What would you like to share?</h2></div><span class="community-composer-icon" aria-hidden="true">✎</span></div><form id="communityHubPost"><textarea class="input" name="body" maxlength="5000" placeholder="Share an update, ask a question, or offer a useful idea…"></textarea><label class="community-media-field"><span aria-hidden="true">＋</span><span class="sr-only">Optional image URL</span><input class="input" name="image_url" type="url" placeholder="Add an image URL (HTTPS, optional)"></label><div class="community-composer-actions"><select class="input" name="group_id"><option value="">Post to everyone</option>' +
        joined
          .map(
            (group) =>
              '<option value="' +
              group.id +
              '" ' +
              (group.id === groupId ? "selected" : "") +
              ">" +
              esc(group.name) +
              "</option>",
          )
          .join("") +
        '</select><select class="input" name="visibility"><option value="community">Everyone in community</option><option value="connections">My connections</option></select><button class="button">Publish post</button></div></form></section>';
      const cards = posts
        .map((post) => {
          const isOwner = post.author_id === me.id || me.role === "admin";
          const avatar = post.profile_photo_url
            ? safeImage(post.profile_photo_url, "")
            : esc(
                (alumniDisplayName(post.author_name || "A") || "A")
                  .split(/\s+/)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase(),
              );
          return (
            '<article class="community-hub-post panel"><header class="community-hub-post-author"><span class="community-post-avatar">' +
            avatar +
            "</span><div><strong>" +
            esc(alumniDisplayName(post.author_name || "Alumni member")) +
            "</strong><small>" +
            esc(
              [post.author_job_title, post.author_department]
                .filter(Boolean)
                .join(" · ") || "Alumni community",
            ) +
            " · " +
            new Date(post.created_at).toLocaleDateString() +
            "</small></div>" +
            (post.group_name
              ? '<a class="tag" href="#community?tab=feed&group_id=' +
                post.group_id +
                '">' +
                esc(post.group_name) +
                "</a>"
              : "") +
            (isOwner
              ? '<button class="icon-button community-delete" data-post-delete="' +
                post.id +
                '" aria-label="Delete post">×</button>'
              : "") +
            "</header>" +
            (post.body
              ? '<p class="community-hub-post-body">' +
                esc(post.body.replace(/\s*Fictional demo post\.\s*$/i, "")) +
                "</p>"
              : "") +
            (post.image_url
              ? '<a class="community-post-media" href="' +
                esc(post.image_url) +
                '" target="_blank" rel="noopener noreferrer">' +
                safeImage(
                  post.image_url,
                  "Shared by " + alumniDisplayName(post.author_name || "a member"),
                ) +
                "</a>"
              : "") +
            '<div class="community-hub-post-stats"><span>' +
            Number(post.comment_count || 0) +
            " comments</span><span>" +
            Number(post.like_count || 0) +
            " likes · " +
            Number(post.upvote_count || 0) +
            ' upvotes</span></div><div class="community-hub-post-actions"><button class="button button-outline button-small ' +
            (post.my_reaction === "like" ? "selected" : "") +
            '" data-post-reaction="like" data-post-id="' +
            post.id +
            '">♡ Like · ' +
            Number(post.like_count || 0) +
            '</button><button class="button button-outline button-small ' +
            (post.my_reaction === "upvote" ? "selected" : "") +
            '" data-post-reaction="upvote" data-post-id="' +
            post.id +
            '">⬆ Upvote · ' +
            Number(post.upvote_count || 0) +
            '</button><button class="button button-outline button-small" data-post-comments="' +
            post.id +
            '">Comments · ' +
            Number(post.comment_count || 0) +
            '</button><button class="button button-outline button-small" data-post-report="' +
            post.id +
            '">Report</button></div><div class="community-comments hidden" id="communityComments-' +
            post.id +
            '"><div class="community-comment-list"></div><form data-community-comment="' +
            post.id +
            '"><input class="input" name="body" required maxlength="2000" placeholder="Add to the discussion"><button class="button button-small">Comment</button></form></div></article>'
          );
        })
        .join("");
      const body =
        '<div class="community-feed-layout"><main>' +
        composer +
        '<div class="community-feed-heading"><div><span class="eyebrow">LATEST CONVERSATIONS</span><h2>' +
        (currentGroup ? esc(currentGroup.name) : "Your discussion feed") +
        '</h2></div><select id="communityGroupFilter" class="input"><option value="">All discussions</option>' +
        groups
          .map(
            (group) =>
              '<option value="' +
              group.id +
              '" ' +
              (group.id === groupId ? "selected" : "") +
              ">" +
              esc(group.name) +
              "</option>",
          )
          .join("") +
        '</select></div><div class="community-hub-feed">' +
        (cards ||
          '<section class="panel community-empty community-start"><span>◉</span><h3>Your community starts with one conversation</h3><p>Ask a question, share a lesson from work, or join a group that matches your interests.</p><div><a class="button button-outline button-small" href="#community?tab=groups">Browse groups</a><a class="button button-outline button-small" href="#community?tab=members">Meet alumni</a></div></section>') +
        '</div></main><aside class="community-hub-aside panel"><span class="eyebrow">FIND YOUR PEOPLE</span><h2>Good communities start with a conversation.</h2><p>Join a group to follow focused discussions and share with people who have similar interests.</p><a class="button button-outline" href="#community?tab=groups">Explore groups →</a><hr><span class="eyebrow">UP NEXT</span><p>Meet alumni online or on campus.</p><a class="text-link" href="#community?tab=events">Explore events →</a></aside></div>';
      frame(tab, body);
      $("#communityGroupFilter").onchange = (event) => {
        location.hash =
          "community?tab=feed" +
          (event.target.value ? "&group_id=" + event.target.value : "");
      };
      $("#communityHubPost").onsubmit = async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.target));
        try {
          await api("/community/posts", {
            method: "POST",
            body: JSON.stringify({
              body: values.body,
              image_url: values.image_url,
              group_id: values.group_id || null,
              visibility: values.visibility,
            }),
          });
          toast("Post shared");
          refresh();
        } catch (error) {
          toast(error.message);
        }
      };
      $$('[data-post-reaction]').forEach(
        (button) =>
          (button.onclick = async () => {
            try {
              await api("/community/posts/" + button.dataset.postId + "/reaction", {
                method: "POST",
                body: JSON.stringify({ reaction: button.dataset.postReaction }),
              });
              refresh();
            } catch (error) {
              toast(error.message);
            }
          }),
      );
      $$('[data-post-comments]').forEach(
        (button) =>
          (button.onclick = async () => {
            const box = $("#communityComments-" + button.dataset.postComments);
            box.classList.toggle("hidden");
            if (box.dataset.loaded) return;
            try {
              const result = await api(
                "/community/posts/" + button.dataset.postComments + "/comments",
              );
              box.querySelector(".community-comment-list").innerHTML =
                (result.items || [])
                  .map(
                    (comment) =>
                      '<p><strong>' +
                      esc(comment.author_name) +
                      "</strong> " +
                      esc(comment.body) +
                      "</p>",
                  )
                  .join("") ||
                '<p class="subtle">No comments yet. Add the first one.</p>';
              box.dataset.loaded = "1";
            } catch (error) {
              toast(error.message);
            }
          }),
      );
      $$('[data-community-comment]').forEach(
        (form) =>
          (form.onsubmit = async (event) => {
            event.preventDefault();
            try {
              await api(
                "/community/posts/" + form.dataset.communityComment + "/comments",
                {
                  method: "POST",
                  body: JSON.stringify({ body: new FormData(form).get("body") }),
                },
              );
              toast("Comment added");
              refresh();
            } catch (error) {
              toast(error.message);
            }
          }),
      );
      $$('[data-post-delete]').forEach(
        (button) =>
          (button.onclick = async () => {
            if (!confirm("Delete this post?")) return;
            try {
              await api("/community/posts/" + button.dataset.postDelete, {
                method: "DELETE",
              });
              refresh();
            } catch (error) {
              toast(error.message);
            }
          }),
      );
      $$('[data-post-report]').forEach(
        (button) =>
          (button.onclick = async () => {
            const reason = prompt("Why should this post be reviewed?");
            if (!reason) return;
            try {
              await api("/reports", {
                method: "POST",
                body: JSON.stringify({
                  target_type: "post",
                  target_id: Number(button.dataset.postReport),
                  reason,
                }),
              });
              toast("Report sent for review");
            } catch (error) {
              toast(error.message);
            }
          }),
      );
      return;
    }

    if (tab === "members") {
      const members = (await api("/community/members")).items || [];
      frame(
        tab,
        '<section class="community-section-block"><div class="community-section-heading"><div><span class="eyebrow">MEMBER DIRECTORY</span><h2>Find a fellow alum</h2><p>Explore members by their work, interests, and university experience.</p></div><input class="input" id="communityMemberSearch" placeholder="Search name, role, skill, or department"></div><div class="community-member-grid" id="communityMemberGrid"></div></section>',
      );
      const drawMembers = () => {
        const query = $("#communityMemberSearch").value.trim().toLowerCase();
        const matching = members.filter((member) =>
          [
            member.name,
            member.job_title,
            member.company,
            member.department,
            member.skills,
            member.industry,
          ].some((value) => String(value || "").toLowerCase().includes(query)),
        );
        $("#communityMemberGrid").innerHTML =
          matching
            .map((member) =>
              cardPerson(member, true).replace(
                "</article>",
                '<p class="community-shared-count">' +
                  (Number(member.shared_connections || 0)
                    ? Number(member.shared_connections) + " shared connections"
                    : "No shared connections yet") +
                  "</p></article>",
              ),
            )
            .join("") ||
          empty("No matching members", "Try a different name, skill, or department.");
      };
      $("#communityMemberSearch").oninput = drawMembers;
      drawMembers();
      return;
    }

    if (tab === "groups") {
      frame(
        tab,
        '<section class="community-section-block"><div class="community-section-heading"><div><span class="eyebrow">INTERESTS · DEPARTMENTS · CAREERS</span><h2>Find your group</h2><p>Join a focused space, follow its discussions, and add your perspective.</p></div><span class="community-group-count">' +
          groups.length +
          ' groups</span></div><div class="community-group-grid">' +
          groups
            .map(
              (group) =>
                '<article class="community-group-card panel"><div class="community-group-mark">' +
                esc((group.category || "G").slice(0, 1)) +
                '</div><span class="eyebrow">' +
                esc(group.category) +
                (group.department ? " · " + esc(group.department) : "") +
                "</span><h3>" +
                esc(group.name) +
                "</h3><p>" +
                esc(group.description) +
                '</p><div class="community-group-foot"><span>' +
                Number(group.member_count || 0) +
                " members</span><div>" +
                (group.joined_by_me
                  ? '<a class="button button-outline button-small" href="#community?tab=feed&group_id=' +
                    group.id +
                    '">View discussions</a><button class="button button-outline button-small" data-group-join="' +
                    group.id +
                    '" data-joined="1">Joined ✓</button>'
                  : '<button class="button button-small" data-group-join="' +
                    group.id +
                    '" data-joined="0">Join group</button>') +
                "</div></div></article>",
            )
            .join("") +
          "</div></section>",
      );
      $$('[data-group-join]').forEach(
        (button) =>
          (button.onclick = async () => {
            const joining = button.dataset.joined !== "1";
            try {
              await api("/community/groups/" + button.dataset.groupJoin + "/join", {
                method: joining ? "POST" : "DELETE",
              });
              toast(joining ? "Joined group" : "Left group");
              refresh();
            } catch (error) {
              toast(error.message);
            }
          }),
      );
      return;
    }

    if (tab === "events") {
      const events = ((await api("/events")).items || [])
        .filter((event) => event.status === "published" && new Date(event.starts_at) >= new Date())
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      const cards = events
        .map(
          (event) =>
            '<article class="community-event-card panel"><div class="community-event-date"><strong>' +
            new Date(event.starts_at).toLocaleDateString(undefined, { day: "2-digit" }) +
            "</strong><span>" +
            new Date(event.starts_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }) +
            '</span></div><span class="eyebrow">' +
            esc(event.mode === "online" ? "ONLINE EVENT" : "COMMUNITY MEETUP") +
            "</span><h3>" +
            esc(event.title) +
            "</h3><p>" +
            esc(event.description || "Join fellow alumni for a community gathering.") +
            '</p><div class="community-event-location">⌖ ' +
            esc(event.location || "Location to be announced") +
            '</div><div class="community-event-foot"><span>' +
            Number(event.registrations || 0) +
            " attending</span>" +
            (event.is_registered
              ? '<button class="button button-outline button-small" data-community-rsvp="' +
                event.id +
                '" data-rsvp="1">RSVP’d ✓</button>'
              : '<button class="button button-small" data-community-rsvp="' +
                event.id +
                '" data-rsvp="0">RSVP</button>') +
            "</div></article>",
        )
        .join("");
      frame(
        tab,
        '<section class="community-section-block"><div class="community-section-heading"><div><span class="eyebrow">MEET · LEARN · CONNECT</span><h2>Community events</h2><p>Upcoming meetups, webinars, and alumni gatherings.</p></div><a class="button button-outline" href="#events">Full events page →</a></div><div class="community-event-grid">' +
          (cards ||
            '<section class="panel community-empty"><span>▦</span><h3>No upcoming events yet</h3><p>Check back for the next alumni meetup, webinar, or community gathering.</p><a class="text-link" href="#events">Open events page →</a></section>') +
          "</div></section>",
      );
      $$('[data-community-rsvp]').forEach(
        (button) =>
          (button.onclick = async () => {
            const cancel = button.dataset.rsvp === "1";
            try {
              await api("/events/" + button.dataset.communityRsvp + "/register", {
                method: cancel ? "DELETE" : "POST",
              });
              toast(cancel ? "RSVP cancelled" : "You are on the guest list");
              refresh();
            } catch (error) {
              toast(error.message);
            }
          }),
      );
      return;
    }

    if (tab === "news") {
      const [newsResult, postResult] = await Promise.all([
        api("/announcements").catch(() => ({ items: [] })),
        api("/community/posts?limit=6").catch(() => ({ items: [] })),
      ]);
      const news = newsResult.items || [];
      const posts = postResult.items || [];
      const announcementCards = news
        .map(
          (item) =>
            '<article class="community-news-card panel"><span class="eyebrow">COMMUNITY UPDATE · ' +
            new Date(item.created_at).toLocaleDateString() +
            "</span><h3>" +
            esc(item.title) +
            "</h3><p>" +
            esc(item.body) +
            "</p></article>",
        )
        .join("");
      const postCards = posts
        .map(
          (post) =>
            '<article class="community-news-card panel"><span class="eyebrow">FROM THE ALUMNI NETWORK · ' +
            new Date(post.created_at).toLocaleDateString() +
            "</span><h3>" +
            esc(alumniDisplayName(post.author_name || "Alumni member")) +
            " shared an update</h3><p>" +
            esc(post.body || "Shared an image with the alumni community.") +
            '</p><a class="text-link" href="#community?tab=feed">Join the discussion →</a></article>',
        )
        .join("");
      const fallback = [
        ["Build a profile people can find", "Add your university, department, skills, and career interests so members can discover shared experience.", "#profile", "PROFILE TIP"],
        ["Join a focused alumni group", "Find a department or interest group, follow its discussions, and share what you have learned.", "#community?tab=groups", "COMMUNITY NOTE"],
        ["Bring your network to an event", "Meet alumni in person or online and turn good conversations into lasting professional connections.", "#community?tab=events", "NETWORK UPDATE"],
      ].map(([title, body, href, type]) =>
        '<article class="community-news-card panel"><span class="eyebrow">' +
        type +
        "</span><h3>" +
        title +
        "</h3><p>" +
        body +
        '</p><a class="text-link" href="' +
        href +
        '">Explore →</a></article>',
      ).join("");
      frame(
        tab,
        '<section class="community-news-hero"><div><span class="eyebrow">OFFICIAL UPDATES · COMMUNITY HIGHLIGHTS</span><h2>News from across the network</h2><p>Platform announcements, opportunities, and useful notes for your alumni community.</p></div><a class="button button-outline" href="#announcements">All announcements →</a></section><section class="community-section-block"><div class="community-news-grid">' +
          (announcementCards + postCards || fallback) +
          "</div></section>",
      );
      return;
    }

    if (tab === "messages") {
      const [conversationResult, connectionResult] = await Promise.all([
        api("/conversations").catch(() => ({ items: [] })),
        api("/connections").catch(() => ({ items: [] })),
      ]);
      const conversations = conversationResult.items || [];
      const connections = connectionResult.items || [];
      const rows = conversations
        .map((conversation) => {
          const person = conversation.other_user || {};
          const avatar = person.profile_photo_url
            ? safeImage(person.profile_photo_url)
            : esc((person.name || "A").split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase());
          return '<a class="community-message-row panel" href="#messages/' +
            conversation.id +
            '"><span class="community-post-avatar">' +
            avatar +
            "</span><span><strong>" +
            esc(person.name || "Alumni member") +
            "</strong><small>" +
            esc(person.job_title || person.department || "Alumni connection") +
            "</small><span>" +
            esc(conversation.last_message || "Start a conversation") +
            '</span></span><span class="community-message-unread">' +
            (Number(conversation.unread_count || 0)
              ? Number(conversation.unread_count) + " new"
              : "Open chat →") +
            "</span></a>";
        })
        .join("");
      const contactRows = connections
        .map(
          (person) =>
            '<article class="community-message-contact panel"><div><strong>' +
            esc(alumniDisplayName(person.name || "Alumni member")) +
            "</strong><small>" +
            esc([person.job_title, person.company || person.department].filter(Boolean).join(" · ") || "Your connection") +
            '</small></div><form data-community-new-message="' +
            Number(person.user_id) +
            '"><input class="input" name="body" maxlength="5000" required placeholder="Write a first message"><button class="button button-small">Send</button></form></article>',
        )
        .join("");
      frame(
        tab,
        '<section class="community-section-block"><div class="community-section-heading"><div><span class="eyebrow">PRIVATE CONVERSATIONS</span><h2>Your messages</h2><p>Continue a chat or send a first message to any accepted connection.</p></div><a class="button button-outline" href="#messages">Open messages →</a></div><div class="community-message-list">' +
          (rows ||
            '<section class="panel community-empty"><span>✉</span><h3>No messages yet</h3><p>Start a private conversation with one of your accepted connections below.</p></section>') +
          '</div></section><section class="community-section-block"><div class="community-section-heading"><div><span class="eyebrow">YOUR NETWORK</span><h2>Start a conversation</h2><p>Messages are available between accepted connections.</p></div><a class="text-link" href="#community?tab=members">Find alumni →</a></div><div class="community-message-list">' +
          (contactRows ||
            '<section class="panel community-empty"><span>◎</span><h3>No accepted connections yet</h3><p>Explore alumni and send a connection request. Once it is accepted, you can message each other here.</p><a class="button button-outline" href="#community?tab=members">Explore members →</a></section>') +
          "</div></section>",
      );
      $$('[data-community-new-message]').forEach(
        (form) =>
          (form.onsubmit = async (event) => {
            event.preventDefault();
            try {
              const result = await api("/messages/" + form.dataset.communityNewMessage, {
                method: "POST",
                body: JSON.stringify({ body: new FormData(form).get("body") }),
              });
              location.hash = "messages/" + result.conversation_id;
            } catch (error) {
              toast(error.message);
            }
          }),
      );
    }
  }

  window.communityHub = communityHub;
  community = communityHub;
  if (location.hash.slice(1).split("?")[0] === "community") render();
})();
